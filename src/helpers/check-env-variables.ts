export default function checkEnvVaribale<T = string>(key: string): T {
  const val = process.env[key];

  if (!val) throw new Error(`Missing env variable: ${key}`);

  return val as T;
}
