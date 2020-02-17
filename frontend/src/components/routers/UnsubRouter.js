import React from 'react';
import { useParams } from "react-router-dom";

import Unsub from './../containers/Unsub.js';

function UnsubRouter() {
  let { unsubToken } = useParams();
  return (
    <Unsub unsubToken={unsubToken} />
  );
}

export default UnsubRouter;