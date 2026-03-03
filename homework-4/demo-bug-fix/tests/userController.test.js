'use strict';

const { getUserById, getAllUsers } = require('../src/controllers/userController');

// ---------------------------------------------------------------------------
// Shared mock factory — called in beforeEach so every test gets a fresh copy
// ---------------------------------------------------------------------------
function makeMocks(paramOverrides = {}) {
  const req = { params: { ...paramOverrides } };
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis()
  };
  return { req, res };
}

// ===========================================================================
// getUserById
// ===========================================================================
describe('getUserById', () => {
  // -------------------------------------------------------------------------
  // Regression — the exact bug that was fixed (API-404)
  // -------------------------------------------------------------------------
  describe('regression: string ID coerced to number (API-404)', () => {
    test('string "123" resolves to user with numeric id 123 (Alice Smith)', async () => {
      const { req, res } = makeMocks({ id: '123' });

      await getUserById(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        id: 123,
        name: 'Alice Smith',
        email: 'alice@example.com'
      });
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — all three valid users
  // -------------------------------------------------------------------------
  describe('happy path: valid IDs return the correct user', () => {
    test('id "456" returns Bob Johnson', async () => {
      const { req, res } = makeMocks({ id: '456' });

      await getUserById(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        id: 456,
        name: 'Bob Johnson',
        email: 'bob@example.com'
      });
    });

    test('id "789" returns Charlie Brown', async () => {
      const { req, res } = makeMocks({ id: '789' });

      await getUserById(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        id: 789,
        name: 'Charlie Brown',
        email: 'charlie@example.com'
      });
    });
  });

  // -------------------------------------------------------------------------
  // Error path — non-existent IDs return 404 with correct body
  // -------------------------------------------------------------------------
  describe('error path: unknown IDs return 404', () => {
    test('id "999" returns 404 with { error: "User not found" }', async () => {
      const { req, res } = makeMocks({ id: '999' });

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('id "1" (not in dataset) returns 404', async () => {
      const { req, res } = makeMocks({ id: '1' });

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  // -------------------------------------------------------------------------
  // Edge / boundary cases
  // -------------------------------------------------------------------------
  describe('edge cases: boundary and invalid inputs', () => {
    test('id "0" (zero) returns 404 — no user has id 0', async () => {
      const { req, res } = makeMocks({ id: '0' });

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('id "-1" (negative string) returns 404', async () => {
      const { req, res } = makeMocks({ id: '-1' });

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('id "abc" (non-numeric string) returns 404 — Number("abc") is NaN', async () => {
      const { req, res } = makeMocks({ id: 'abc' });

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('id "" (empty string) returns 404 — Number("") is 0, no match', async () => {
      const { req, res } = makeMocks({ id: '' });

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('id undefined (missing param) returns 404 — Number(undefined) is NaN', async () => {
      // req.params is set but .id is not present → undefined
      const { req, res } = makeMocks();

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });
});

// ===========================================================================
// getAllUsers
// ===========================================================================
describe('getAllUsers', () => {
  test('returns all three users as an array', async () => {
    const { req, res } = makeMocks();

    await getAllUsers(req, res);

    const [users] = res.json.mock.calls;
    expect(Array.isArray(users[0])).toBe(true);
    expect(users[0]).toHaveLength(3);
  });

  test('each user has id (number), name, and email fields', async () => {
    const { req, res } = makeMocks();

    await getAllUsers(req, res);

    const [users] = res.json.mock.calls;
    users[0].forEach(user => {
      expect(typeof user.id).toBe('number');
      expect(typeof user.name).toBe('string');
      expect(typeof user.email).toBe('string');
    });
  });

  test('does not call res.status (always 200)', async () => {
    const { req, res } = makeMocks();

    await getAllUsers(req, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);
  });
});
