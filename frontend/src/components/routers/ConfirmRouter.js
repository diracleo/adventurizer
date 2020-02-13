import React from 'react';
import { useParams } from "react-router-dom";

import Confirm from './../containers/Confirm.js';

function ConfirmRouter() {
  let { confirmToken } = useParams();
  return (
    <Confirm confirmToken={confirmToken} />
  );
}

export default ConfirmRouter;