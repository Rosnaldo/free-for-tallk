import React from 'react';

interface BrazilMapBackgroundProps {
  opacity?: number;
  className?: string;
}

export const BrazilMapBackground: React.FC<BrazilMapBackgroundProps> = ({
  opacity = 0.22,
  className = '',
}) => {
  return (
    <div
      id="brazil-map-bg-container"
      className={`absolute bottom-[20px] left-[20px] pointer-events-none z-0 select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1000 950"
        className="w-[280px] sm:w-[420px] md:w-[480px] h-auto max-h-[46vh] object-contain object-bottom-left transition-opacity duration-700 block"
        style={{ opacity }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* State Boundaries & Contours: Only Outline/Stroke, No Fill or Grid */}
        <g
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {/* Roraima */}
          <path
            id="state-RR"
            d="M 330 35 L 365 15 L 405 18 L 400 65 L 415 110 L 385 185 L 360 170 L 365 125 L 330 95 L 340 55 Z"
          />

          {/* Amapá */}
          <path
            id="state-AP"
            d="M 525 28 L 545 60 L 555 100 L 525 170 L 485 175 L 490 120 L 465 85 L 505 80 Z"
          />

          {/* Amazonas */}
          <path
            id="state-AM"
            d="M 250 95 L 290 90 L 315 115 L 330 95 L 365 125 L 360 170 L 385 185 L 420 205 L 425 380 L 375 385 L 380 435 L 340 430 L 335 390 L 295 385 L 195 350 L 205 320 L 245 270 L 250 165 L 240 140 Z"
          />

          {/* Acre */}
          <path
            id="state-AC"
            d="M 195 350 L 295 385 L 305 410 L 240 440 L 200 405 L 188 355 Z"
          />

          {/* Pará */}
          <path
            id="state-PA"
            d="M 405 18 L 465 85 L 490 120 L 485 175 L 525 170 L 550 205 L 610 225 L 580 345 L 550 375 L 550 405 L 425 405 L 425 380 L 420 205 L 385 185 L 415 110 L 400 65 Z"
          />

          {/* Rondônia */}
          <path
            id="state-RO"
            d="M 335 390 L 380 435 L 400 480 L 405 565 L 375 545 L 325 505 L 340 430 Z"
          />

          {/* Maranhão */}
          <path
            id="state-MA"
            d="M 610 225 L 660 235 L 685 320 L 635 365 L 580 345 Z"
          />

          {/* Piauí */}
          <path
            id="state-PI"
            d="M 660 235 L 700 240 L 730 350 L 680 400 L 635 365 L 685 320 Z"
          />

          {/* Ceará */}
          <path
            id="state-CE"
            d="M 700 240 L 755 255 L 785 315 L 745 350 L 730 350 Z"
          />

          {/* Rio Grande do Norte */}
          <path
            id="state-RN"
            d="M 755 255 L 785 285 L 785 315 Z"
          />

          {/* Paraíba */}
          <path
            id="state-PB"
            d="M 745 315 L 785 315 L 785 340 L 725 345 Z"
          />

          {/* Pernambuco */}
          <path
            id="state-PE"
            d="M 680 365 L 745 350 L 785 340 L 780 375 L 730 380 L 680 385 Z"
          />

          {/* Alagoas */}
          <path
            id="state-AL"
            d="M 745 375 L 775 375 L 765 405 L 735 395 Z"
          />

          {/* Sergipe */}
          <path
            id="state-SE"
            d="M 735 395 L 765 405 L 750 435 L 730 420 Z"
          />

          {/* Tocantins */}
          <path
            id="state-TO"
            d="M 550 375 L 580 345 L 635 365 L 610 520 L 545 470 L 550 405 Z"
          />

          {/* Bahia */}
          <path
            id="state-BA"
            d="M 635 365 L 680 400 L 730 420 L 750 435 L 720 560 L 690 600 L 640 595 L 595 565 L 610 520 Z"
          />

          {/* Mato Grosso */}
          <path
            id="state-MT"
            d="M 425 405 L 550 405 L 545 470 L 610 520 L 550 610 L 435 605 L 400 480 L 380 435 L 425 380 Z"
          />

          {/* Goiás & DF */}
          <path
            id="state-GO"
            d="M 545 470 L 610 520 L 595 565 L 605 635 L 515 645 L 505 590 L 550 610 Z"
          />

          {/* Distrito Federal (DF) */}
          <rect
            x="580"
            y="545"
            width="16"
            height="14"
            rx="2"
          />

          {/* Mato Grosso do Sul */}
          <path
            id="state-MS"
            d="M 435 605 L 515 645 L 490 735 L 435 710 L 435 605 Z"
          />

          {/* Minas Gerais */}
          <path
            id="state-MG"
            d="M 595 565 L 640 595 L 690 600 L 705 645 L 670 725 L 600 720 L 580 670 L 605 635 Z"
          />

          {/* Espírito Santo */}
          <path
            id="state-ES"
            d="M 690 600 L 705 645 L 690 680 L 670 670 Z"
          />

          {/* Rio de Janeiro */}
          <path
            id="state-RJ"
            d="M 670 670 L 690 680 L 635 730 L 625 710 Z"
          />

          {/* São Paulo */}
          <path
            id="state-SP"
            d="M 515 645 L 605 635 L 580 670 L 600 720 L 625 710 L 595 765 L 525 745 L 490 735 Z"
          />

          {/* Paraná */}
          <path
            id="state-PR"
            d="M 490 735 L 525 745 L 575 770 L 565 810 L 485 790 Z"
          />

          {/* Santa Catarina */}
          <path
            id="state-SC"
            d="M 485 790 L 565 810 L 545 845 L 475 830 Z"
          />

          {/* Rio Grande do Sul */}
          <path
            id="state-RS"
            d="M 475 830 L 545 845 L 525 930 L 500 970 L 440 900 L 475 830 Z"
          />
        </g>
      </svg>
    </div>
  );
};
