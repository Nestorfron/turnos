import React from "react";

const LogoSGP = () => {
  return (
    <svg
      width="400"
      height="50"
      viewBox="100 25 900 80"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo Sistema de Gestión de Personal"
    >
      {/* Letras grandes */}
      <text
        x="200"
        y="90"
        textAnchor="middle"
        fontFamily="Montserrat, sans-serif"
        fontSize="100"
        fontWeight="bold"
        fill="white"
      >
        SGP
      </text>

      {/* Texto pequeño pegado debajo y con mismo ancho que SGP */}
      <text
        x="200"
        y="120"
        textAnchor="middle"
        fontFamily="Montserrat, sans-serif"
        fontSize="30"
        fill="white"
        textLength="200"
        lengthAdjust="spacingAndGlyphs"
      >
        Sistema de Gestión de Personal
      </text>
    </svg>
  );
};

export default LogoSGP;
