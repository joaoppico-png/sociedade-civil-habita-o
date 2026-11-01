// Que sites podem mostrar esta ferramenta dentro de um iframe. Função pura.
// Defesa em JavaScript contra clickjacking enquanto o servidor não envia `frame-ancestors`;
// não a substitui (um atacante pode desativar scripts no iframe com sandbox).

const PERMITIDOS = ['https://sociedadecivil.pt', 'https://www.sociedadecivil.pt'];
// Pré-visualização do artefacto publicado no Claude.
const SUFIXOS_PERMITIDOS = ['.claude.ai', '.claudeusercontent.com'];

/**
 * true se a origem anfitriã pode incorporar a ferramenta.
 * Origem desconhecida (null) é aceite: sem referrer nem ancestorOrigins não há como decidir,
 * e bloquear partiria incorporações legítimas com políticas de referrer restritas.
 */
export function anfitriaoPermitido(origem, propria) {
  if (!origem) return true;
  if (origem === propria || PERMITIDOS.includes(origem)) return true;
  try {
    const url = new URL(origem);
    if (url.protocol !== 'https:') return false;
    return url.hostname === 'claude.ai' || SUFIXOS_PERMITIDOS.some((s) => url.hostname.endsWith(s));
  } catch {
    return false;
  }
}
