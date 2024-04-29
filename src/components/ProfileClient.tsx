"use client"

import { useApp } from '@/contexts/appContext';
import React from 'react'

function ProfileClient() {

  return (
    <div>
      <div className='mb-5'>Profile</div>
      <button onClick={() => {
        var hostname = window.location.hostname;
        if (hostname === 'localhost') {
          console.log(hostname);
        } else {
          console.log(window.location.host);
        }
      }}>Log domain</button>
    </div>
  )
}

export default ProfileClient