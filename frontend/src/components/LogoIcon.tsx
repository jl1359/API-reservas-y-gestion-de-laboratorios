
export default function LogoIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150" className={className} fill="none">
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4f46e5" />
          <stop offset="100%" stop-color="#3b82f6" />
        </linearGradient>
      </defs>
      
      {/* Contorno del Matraz (Hereda el color del texto mediante currentColor) */}
      <path d="M55,15 L55,45 L20,105 L20,120 C20,128 26,135 35,135 L85,135 C94,135 100,128 100,120 L100,105 L65,45 L65,15 Z" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
      <line x1="40" y1="15" x2="80" y2="15" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      
      {/* Líquido con el gradiente de la marca */}
      <path d="M29,85 L91,85 L95,95 L95,120 C95,125 90,130 85,130 L35,130 C30,130 25,125 25,120 L25,95 Z" fill="url(#brandGrad)" />
      
      {/* Burbujas del líquido */}
      <circle cx="45" cy="115" r="4" fill="#ffffff" />
      <circle cx="75" cy="105" r="3" fill="#ffffff" />
      <circle cx="60" cy="100" r="5" fill="#ffffff" />
      
      {/* Insignia flotante de Check (Representando reserva confirmada) */}
      <circle cx="90" cy="40" r="18" fill="#ffffff" stroke="currentColor" strokeWidth="6" />
      <path d="M82,40 L87,45 L100,32" stroke="url(#brandGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}