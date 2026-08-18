import { setAccessToken, getAccessToken, clearAccessToken } from './authStore';

describe('authStore (In-Memory Token Management)', () => {
  beforeEach(() => {
    clearAccessToken();
    localStorage.clear();
  });

  test('deve definir e recuperar o token em memoria', () => {
    const token = 'jwt_test_token_123';
    setAccessToken(token);

    expect(getAccessToken()).toBe(token);
    expect(localStorage.getItem('token')).toBeNull(); // Nao deve salvar no localStorage
  });

  test('deve limpar o token em memoria', () => {
    setAccessToken('jwt_test_token_123');
    clearAccessToken();

    expect(getAccessToken()).toBeNull();
  });
});
