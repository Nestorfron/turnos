const LogoSGP = () => {
  return (
    <svg
      viewBox="100 25 900 80"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo Sistema de Gestión de Personal"
      style={{ width: "100%", height: "auto", maxWidth: "400px" }} // máximo ancho y que se adapte
      preserveAspectRatio="xMidYMid meet"
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
