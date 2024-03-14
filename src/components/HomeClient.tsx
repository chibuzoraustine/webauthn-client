"use client"

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

  // const apiUrl = 'http://localhost:5000';
  const apiUrl = 'https://chibuzornode.moipayway.dev/webauthn';

  const removeCredential = () => {
    localStorage.removeItem('credential');
    setIsAuthenticated(false)
    setCId(null)
  }

  const register = async () => {
    setIsFetching(true)

    try {
      const credentialCreationOptions = await (await fetch(`${apiUrl}/registration-options`, {
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })).json();

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

      const resp = await (await fetch(`${apiUrl}/register`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: data }),
        credentials: 'include'
      })).json();

      // registerButton.style.display = 'none';
      // authenticateButton.style.display = 'block';
      // deleteButton.style.display = 'block';
      // dialogBody.innerHTML = 'Registration successful!';
      // authDialog.open();
      console.log(resp)
    }
    catch (e) {
      console.error('registration failed', e);

      // dialogBody.innerHTML = 'Registration failed';
      // authDialog.open();
    }
    finally {
      setIsFetching(false)
      // registerButton.disabled = false;
      // loader.style.display = 'none';
    }
  };

  const authenticate = async () => {
    // authenticateButton.disabled = true;
    // deleteButton.disabled = true;
    // loader.style.display = 'block';
    setIsFetching(true)

    try {
      const credentialRequestOptions = await (await fetch(`${apiUrl}/authentication-options`, {
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })).json();

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

      const response = (await fetch(`${apiUrl}/authenticate`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: data }),
        credentials: 'include'
      }));

      if (response.status === 404) {
        alert("Credential has expired, please register a new credential");
      }
      else {
        const assertionResponse = await response.json();
        setIsAuthenticated(true);
        console.log(assertionResponse)
      }
    }
    catch (e) {
      console.error('authentication failed', e);
      // dialogBody.innerHTML = 'Authentication failed';
      // authDialog.open();
    }
    finally {
      setIsFetching(false)
      // authenticateButton.disabled = false;
      // deleteButton.disabled = false;
      // loader.style.display = 'none';
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
