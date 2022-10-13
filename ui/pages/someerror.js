import axios from "axios";
import React from 'react'
import baseUrl from "utils/baseUrl";

export default function SomeError() {
  const errorApi = baseUrl + "/api/error500";

  const response = axios.get(errorApi);
  console.log('response', response);

  return (
    <div className="c-some-error">
      Some error...
    </div>
  )}

