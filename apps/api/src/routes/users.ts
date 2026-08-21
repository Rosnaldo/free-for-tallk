import { Router } from 'express';
import { UserRole } from '@repo/shared-types';

import { GetKeycloakUser } from '../middleware/get_keycloak_user';
import { GetUser } from '../middleware/get_user';
import { requireRole } from '../middleware/require_role';
import uploadImage from '../middleware/upload_image';
import { getUserModel, toUser } from '../models/user';
import { publishOnlineUserPatch } from '../redis/online_users';
import { generateUniqueSlug } from '../utils/unique_slug';
import { joinUrl } from '../utils/join_url';
import { compressToTargetSize } from '../utils/image_compress';
import { uploadToS3 } from '../helpers/s3';
import { createKeycloakUser, updateKeycloakUser, deleteKeycloakUser } from '../keycloak/admin_client';
import { validateCreateUser, validateEditUser, validateDeleteUser, validateListUsers } from '../validators/user';
import { BadRequestException } from '../exceptions/bad_request';
import { UnauthorizedException } from '../exceptions/unauthorized';
import properties from '../properties';

const router = Router();

function isSelfOrAdmin(currentUser: { _id: string; role: string }, targetId: string): boolean {
  return currentUser.role === UserRole.admin || currentUser._id === targetId;
}

function handleError(err: unknown, res: import('express').Response): void {
  console.error(err);
  const status = (err as { status?: number }).status ?? 500;
  const message = err instanceof Error ? err.message : 'Internal error';
  res.status(status).json({ message });
}

router.get('/users/exists', GetKeycloakUser, GetUser, (req, res) => {
  try {
    res.status(200).json(req.currentUser);
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/users/find-by-slug', GetKeycloakUser, GetUser, async (req, res) => {
  try {
    const slug = req.query.slug;
    if (typeof slug !== 'string' || !slug) throw new BadRequestException('slug é obrigatório');

    const doc = await getUserModel().findOne({ slug });
    if (!doc) throw new BadRequestException('Usuário não encontrado');

    res.status(200).json(toUser(doc));
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/users/count', GetKeycloakUser, GetUser, async (_req, res) => {
  try {
    const model = getUserModel();
    const [admins, members] = await Promise.all([
      model.countDocuments({ role: UserRole.admin }),
      model.countDocuments({ role: UserRole.member }),
    ]);

    res.status(200).json({ admins, members });
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/users/list', GetKeycloakUser, GetUser, async (req, res) => {
  try {
    const { page, pageSize, search, role } = validateListUsers(req.query);

    const query: Record<string, unknown> = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    if (role && role.length > 0) query.role = { $in: role };

    const model = getUserModel();
    const skip = (page - 1) * pageSize;
    const [docs, totalRecords] = await Promise.all([
      model.find(query).skip(skip).limit(pageSize),
      model.countDocuments(query),
    ]);

    res.status(200).json({
      data: docs.map(toUser),
      currentPage: page,
      totalPages: Math.ceil(totalRecords / pageSize),
      totalRecords,
    });
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/users/create', GetKeycloakUser, GetUser, requireRole([UserRole.admin]), async (req, res) => {
  try {
    const input = validateCreateUser(req.body);

    const doc = await getUserModel().create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      role: input.role,
      slug: await generateUniqueSlug(`${input.firstName}-${input.lastName}`),
    });

    await createKeycloakUser({ email: input.email, firstName: input.firstName, lastName: input.lastName });

    res.status(200).json(toUser(doc));
  } catch (err) {
    handleError(err, res);
  }
});

router.put('/users/edit', GetKeycloakUser, GetUser, async (req, res) => {
  try {
    const input = validateEditUser(req.body);

    if (!isSelfOrAdmin(req.currentUser, input._id)) {
      throw new UnauthorizedException('Usuário sem permissão');
    }

    if ((input.email || input.role) && req.currentUser.role !== UserRole.admin) {
      throw new UnauthorizedException('Usuário sem permissão');
    }

    const model = getUserModel();
    const doc = await model.findById(input._id);
    if (!doc) throw new BadRequestException('Usuário não encontrado');

    if (input.firstName) doc.firstName = input.firstName;
    if (input.lastName) doc.lastName = input.lastName;
    if (input.email) doc.email = input.email;
    if (input.role) doc.role = input.role;
    await doc.save();

    if (doc.email) {
      await updateKeycloakUser(doc.email, { firstName: doc.firstName, lastName: doc.lastName });
    }

    res.status(200).json(toUser(doc));
  } catch (err) {
    handleError(err, res);
  }
});

router.delete('/users/delete', GetKeycloakUser, GetUser, async (req, res) => {
  try {
    const input = validateDeleteUser(req.query);

    if (!isSelfOrAdmin(req.currentUser, input._id)) {
      throw new UnauthorizedException('Usuário sem permissão');
    }

    const model = getUserModel();
    const doc = await model.findById(input._id);
    if (!doc) throw new BadRequestException('Usuário não encontrado');

    await model.deleteOne({ _id: input._id });

    if ((doc.role === UserRole.admin || doc.role === UserRole.member) && doc.email) {
      await deleteKeycloakUser(doc.email);
    }

    res.status(200).json({});
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/users/upload-avatar', GetKeycloakUser, GetUser, uploadImage.single('image'), async (req, res) => {
  try {
    if (!req.file) throw new BadRequestException('Image is required');
    if (!req.file.mimetype.startsWith('image/')) throw new BadRequestException('Invalid file type');
    if (!properties.awsS3Bucket) throw new Error('S3 bucket not configured');

    const model = getUserModel();
    const doc = await model.findById(req.currentUser._id);
    if (!doc) throw new BadRequestException('Usuário não encontrado');

    const compressed = await compressToTargetSize(req.file.buffer, 200);
    const s3Path = `avatars/${doc.slug}/${Date.now()}.jpeg`;
    await uploadToS3({
      bucket: properties.awsS3Bucket,
      key: s3Path,
      body: compressed,
      contentType: req.file.mimetype,
    });

    doc.avatar = {
      _id: s3Path,
      s3Host: properties.s3Host,
      cdnHost: properties.cdnHost,
      s3Path,
      url: joinUrl(properties.s3Host, s3Path),
    };
    await doc.save();

    const user = toUser(doc);
    await publishOnlineUserPatch(user._id, { avatar: user.avatar?.url });

    res.status(200).json(user);
  } catch (err) {
    handleError(err, res);
  }
});

export default router;
