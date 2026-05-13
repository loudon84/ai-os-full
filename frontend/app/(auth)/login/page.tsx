export default function LoginRoute() {
  console.log('hite here');
  const LoginPage = require("../../modules/auth/pages/LoginPage").default;
  return <LoginPage />;
}
