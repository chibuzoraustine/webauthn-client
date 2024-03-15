"use client"

import { authenticate, register } from "@/lib/mpw-webauthn";
import { useEffect, useRef, useState } from "react";

export default function HomeClient() {

  const [cId, setCId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ids, setIds] = useState<{
    device_id: string,
    registration_session_id: string
  } | null>(null);
  const regBtn = useRef();
  const authBtn = useRef();

  useEffect(() => {
    const cred = JSON.parse(localStorage.getItem('credential')!);
    if (cred !== null) {
      const { credentialId, registration_session_id, device_id } = cred;
      setCId(credentialId);
      setIds({
        registration_session_id: registration_session_id,
        device_id: device_id
      });
    }
  }, []);

  // const apiUrl = 'http://localhost:5000';
  // const apiUrl = 'https://chibuzornode.moipayway.dev/webauthn';

  const removeCredential = () => {
    localStorage.removeItem('credential');
    setIsAuthenticated(false)
    setCId(null)
  }

  const registerBtn = async () => {
    setIsFetching(true)

    try {
      const resp = await register("123", "chi@example.com");

      // store in local storage
      localStorage.setItem('credential', JSON.stringify({
        credentialId: resp.data.credential_id,
        registration_session_id: resp.data.registration_session_id,
        device_id: resp.data.response.device_id
      }));

      // store in state
      setCId(JSON.stringify({ credentialId: resp.data.credential_id }))
      setIds({
        registration_session_id: resp.data.registration_session_id,
        device_id: resp.data.response.device_id
      })

      console.log(resp)
      setIsFetching(false);
    }
    catch (e) {
      console.error('registration failed', e);
      setIsFetching(false)
    }
  };

  const authenticateBtn = async () => {
    setIsFetching(true)
    if (ids !== null) {
      try {
        const { credentialId } = JSON.parse(localStorage.getItem('credential')!);
        const resp = await authenticate(credentialId, ids.device_id, ids.registration_session_id);
        setIsAuthenticated(true);
        console.log(resp);
        setIsFetching(false);
      }
      catch (e) {
        setIsFetching(false);
        console.error('authentication failed', e);
        alert("Invalid authentication input (credential_id, device_id or registration_session_id), please register a new credential or check your inputs and try again");
      }
    } else {
      alert("Not authenticated")
    }
  };

  return (
    <>
      <div className="mb-10">Home Client</div>

      <div className="flex">
        {
          cId == null ? <button className="px-4 py-2 bg-blue-700 mr-5 disabled:opacity-35" onClick={registerBtn} disabled={isFetching}>Register</button> :
            isAuthenticated ? <>
              <div>
                Hurray, Authenticated successfully
              </div>
            </> :
              <div>
                <button className="px-4 py-2 bg-green-700 mb-6 disabled:opacity-35" onClick={authenticateBtn} disabled={isFetching}>Authenticate</button><br />
                <button className="px-2 py-1 text-xs bg-red-800 disabled:opacity-35" onClick={removeCredential} disabled={isFetching}>Delete credential</button>
              </div>
        }
      </div>
    </>
  );
}
