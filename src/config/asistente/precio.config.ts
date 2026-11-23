// Precio de referencia del café arábica (contrato C, ICE Futures US, símbolo KC), en centavos de USD por libra.
//
// TODO(precio en vivo): no encontramos una API pública y gratuita que publique el precio diario del contrato C
// con licencia de uso comercial. Los datos de ICE se licencian; los proveedores con plan gratis (API Ninjas,
// Commodities-API, etc.) no aclaran el uso comercial, y las series abiertas (FMI/FRED, Alpha Vantage COFFEE)
// son mensuales. Por eso el valor se carga a mano. Para conectar una fuente licenciada, reemplaza la
// implementación de getCoffeePrice() en services/precioCafe.ts; el resto de la app no cambia.
// No hacer scraping de ice.com ni de investing.com.

export const PRECIO_C_MANUAL = {
  /** Centavos de USD por libra. Actualízalo antes de usar el simulador con clientes. */
  centavosLb: 380,
  /** Fecha en que se cargó el valor (AAAA-MM-DD) */
  fecha: '2026-11-23',
  fuente: 'ICE Coffee C (KC) · valor de referencia cargado manualmente',
};

/** Tasa de cambio del día: datos abiertos del Banco de la República (Superfinanciera) en datos.gov.co */
export const FUENTE_TRM = {
  url: 'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1',
  timeoutMs: 4000,
};
