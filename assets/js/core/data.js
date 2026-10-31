// Carregamento dos ficheiros JSON locais, com erro explícito em caso de falha.

export class DataError extends Error {}

export async function loadJSON(nome) {
  let res;
  try {
    res = await fetch(`data/${nome}.json`, { cache: 'no-cache' });
  } catch {
    throw new DataError(`Não foi possível carregar «${nome}». Verifica a ligação e recarrega a página.`);
  }
  if (!res.ok) throw new DataError(`O ficheiro «${nome}» não está disponível (erro ${res.status}).`);
  try {
    return await res.json();
  } catch {
    throw new DataError(`O ficheiro «${nome}» tem um formato inválido.`);
  }
}

export async function loadAll(nomes) {
  const valores = await Promise.all(nomes.map(loadJSON));
  return Object.fromEntries(nomes.map((n, i) => [n, valores[i]]));
}
