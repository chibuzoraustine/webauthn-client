import axios from "axios";

const apiUrl = 'https://chibuzornode.moipayway.dev/webauthn';

const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const base64ToBuffer = (base64: string): ArrayBuffer => {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
};

export const register = async (merchant_id: string, unique_identifier: string): Promise<{
    message: string,
    data: {
        credential_id: string,
        registration_session_id: string,
        response: {
            device_id: string,
            merchant_id: string
        }
    }
}> => {
    try {
        isBrowser();
        const opt_resp = (await axios.post(`${apiUrl}/registration-options`)).data;

        const { registrationOptions: credentialCreationOptions, registration_session_id } = opt_resp.data;

        console.log("registration_session_id", registration_session_id)
        console.log(JSON.parse(JSON.stringify(credentialCreationOptions)))

        credentialCreationOptions.challenge = new Uint8Array(credentialCreationOptions.challenge.data);
        credentialCreationOptions.user.id = new Uint8Array(credentialCreationOptions.user.id.data);
        credentialCreationOptions.user.name = 'chi@test.com';
        credentialCreationOptions.user.displayName = 'badboychi';

        console.log(credentialCreationOptions)

        const credential = await navigator.credentials.create({
            publicKey: credentialCreationOptions
        }) as PublicKeyCredential;

        const credential_id = bufferToBase64(credential.rawId);

        const data = {
            rawId: credential_id,
            response: {
                attestationObject: bufferToBase64((credential.response as AuthenticatorAttestationResponse).attestationObject),
                clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
                id: credential.id,
                type: credential.type
            }
        };

        const resp = (await axios.post(`${apiUrl}/register`, {
            credential: JSON.stringify(data),
            registration_session_id: registration_session_id,
            merchant_id: merchant_id,
            unique_identifier: unique_identifier
        })).data;
        return ({
            message: "Registration successful",
            data: {
                credential_id: credential_id,
                registration_session_id: registration_session_id,
                response: resp.data
            }
        })
    }
    catch (e) {
        throw new RequestError('registration failed', e);
    }
};

export const authenticate = async (credential_id: string, device_id: string, registration_session_id: string): Promise<{
    message: string,
    data: {
        credential_id: string,
        registration_session_id: string,
        authentication_session_id: string
    }
}> => {
    try {
        isBrowser();
        const auth_resp = (await axios.post(`${apiUrl}/authentication-options`)).data;

        const { authnOptions: credentialRequestOptions, authentication_session_id } = auth_resp.data;

        console.log("authentication_session_id", authentication_session_id);

        credentialRequestOptions.challenge = new Uint8Array(credentialRequestOptions.challenge.data);
        credentialRequestOptions.allowCredentials = [
            {
                id: base64ToBuffer(credential_id),
                type: 'public-key',
                transports: ['internal']
            }
        ];

        const credential = await navigator.credentials.get({
            publicKey: credentialRequestOptions
        }) as PublicKeyCredential | null;

        const data = {
            rawId: bufferToBase64(credential!.rawId),
            response: {
                authenticatorData: bufferToBase64((credential!.response as any).authenticatorData),
                signature: bufferToBase64((credential!.response as any).signature),
                userHandle: bufferToBase64((credential!.response as any).userHandle),
                clientDataJSON: bufferToBase64(credential!.response.clientDataJSON),
                id: credential!.id,
                type: credential!.type
            }
        };

        const response = (await axios.post(`${apiUrl}/authenticate`, {
            credential: JSON.stringify(data),
            authentication_session_id: authentication_session_id,
            registration_session_id: registration_session_id,
            device_id: device_id
        })).data;
        return ({
            message: "Athentication Successful",
            data: {
                credential_id: credential_id,
                registration_session_id: registration_session_id,
                authentication_session_id: authentication_session_id
            }
        });
    }
    catch (e) {
        throw new RequestError('Credential has expired, please register a new credential', e)
    }
};

export class RequestError extends Error {
    constructor(
        public message: string = "Bad Request",
        public data: object | unknown = {},
        readonly name: string = "RequestError"
    ) {
        super(message)
    }
}

function isBrowser() {
    if (typeof window === 'undefined') {
        throw new Error('This library is intended for use in browser environments only.');
    }
}