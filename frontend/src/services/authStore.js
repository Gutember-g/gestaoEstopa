// Armazenamento de Access Token estritamente em memória RAM.
// NUNCA salvar em localStorage ou sessionStorage por motivos de segurança (mitigação contra XSS).

let inMemoryToken = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

export const clearAccessToken = () => {
  inMemoryToken = null;
};
