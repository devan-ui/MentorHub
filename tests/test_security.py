import unittest

from app.security import create_access_token, decode_access_token


class SecurityTokenTests(unittest.TestCase):
    def test_create_and_decode_access_token(self):
        payload = {"sub": "user@example.com", "role": "user"}

        token = create_access_token(payload)

        self.assertIsInstance(token, str)
        self.assertTrue(token)
        self.assertEqual(decode_access_token(token)["sub"], "user@example.com")
        self.assertEqual(decode_access_token(token)["role"], "user")


if __name__ == "__main__":
    unittest.main()
