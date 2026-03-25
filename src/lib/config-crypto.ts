const VERSION = "v1";
const ITERATIONS = 310_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string): Uint8Array =>
	Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
	const arrayBuffer = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(arrayBuffer).set(bytes);
	return arrayBuffer;
};

const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
	const passwordKey = await crypto.subtle.importKey(
		"raw",
		textEncoder.encode(password),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			iterations: ITERATIONS,
			salt: toArrayBuffer(salt),
		},
		passwordKey,
		{
			name: "AES-GCM",
			length: 256,
		},
		false,
		["encrypt", "decrypt"],
	);
};

const assertPassword = (password: string): void => {
	if (!password.trim()) {
		throw new Error("Password is required.");
	}
};

export const encryptCaasApiKey = async (apiKey: string, password: string): Promise<string> => {
	assertPassword(password);
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const key = await deriveKey(password, salt);
	const ciphertext = await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: toArrayBuffer(iv),
		},
		key,
		toArrayBuffer(textEncoder.encode(apiKey)),
	);

	return `${VERSION}:${toBase64(salt)}:${toBase64(iv)}:${toBase64(new Uint8Array(ciphertext))}`;
};

export const decryptCaasApiKey = async (
	encryptedApiKey: string,
	password: string,
): Promise<string> => {
	assertPassword(password);
	const [version, saltB64, ivB64, cipherB64] = encryptedApiKey.split(":");
	if (!version || !saltB64 || !ivB64 || !cipherB64 || version !== VERSION) {
		throw new Error("Unsupported encrypted API key format.");
	}

	const key = await deriveKey(password, fromBase64(saltB64));
	const decrypted = await crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: toArrayBuffer(fromBase64(ivB64)),
		},
		key,
		toArrayBuffer(fromBase64(cipherB64)),
	);

	return textDecoder.decode(decrypted);
};
