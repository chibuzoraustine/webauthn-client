"use client"

import axios from "axios";
import { useEffect, useRef, useState } from "react";

export default function HomeClient() {

  const [cId, setCId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const regBtn = useRef();
  const authBtn = useRef();

  const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  };

  const base64ToBuffer = (base64: string): ArrayBuffer => {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
  };

  useEffect(() => {
    const cId_ = localStorage.getItem('credential');
    cId_ !== null && setCId(cId_);
  }, []);

  const apiUrl = 'http://localhost:5000';
  // const apiUrl = 'https://chibuzornode.moipayway.dev/webauthn';

  const removeCredential = () => {
    localStorage.removeItem('credential');
    setIsAuthenticated(false)
    setCId(null)
  }

  const register = async () => {
    setIsFetching(true)

    try {
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

      const credentialId = bufferToBase64(credential.rawId);

      localStorage.setItem('credential', JSON.stringify({ credentialId }));
      setCId(JSON.stringify({ credentialId }))

      const data = {
        rawId: credentialId,
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
        merchant_id: "123",
        unique_identifier: "chi@example.com"
      })).data;
      console.log(resp)
    }
    catch (e) {
      console.error('registration failed', e);
    }
    finally {
      setIsFetching(false)
    }
  };

  const authenticate = async () => {
    setIsFetching(true)

    try {
      const auth_resp = (await axios.post(`${apiUrl}/authentication-options`)).data;

      const { authnOptions: credentialRequestOptions, authentication_session_id } = auth_resp.data;

      console.log("authentication_session_id", authentication_session_id)

      const { credentialId } = JSON.parse(localStorage.getItem('credential')!);

      credentialRequestOptions.challenge = new Uint8Array(credentialRequestOptions.challenge.data);
      credentialRequestOptions.allowCredentials = [
        {
          id: base64ToBuffer(credentialId),
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
        registration_session_id: "16",
        device_id: "123gA26oB7a8J47gb9huAJ8UK7RrGzQfq"
      })).data;

      
      setIsAuthenticated(true);
      console.log(response);
    }
    catch (e) {
      console.error('authentication failed', e);
      alert("Credential has expired, please register a new credential");
    }
    finally {
      setIsFetching(false);
    }
  };

  return (
    <>
      <div className="mb-10">Home Client</div>

      <div className="flex">
        {
          cId == null ? <button className="px-4 py-2 bg-blue-700 mr-5" onClick={register} disabled={isFetching}>Register</button> :
            isAuthenticated ? <>
              <div>
                Hurray, Authenticated successfully
              </div>
            </> :
              <div>
                <button className="px-4 py-2 bg-green-700 mb-6" onClick={authenticate} disabled={isFetching}>Authenticate</button><br />
                <button className="px-2 py-1 text-xs bg-red-800" onClick={removeCredential} disabled={isFetching}>Delete credential</button>
              </div>
        }
      </div>
    </>
  );
}
