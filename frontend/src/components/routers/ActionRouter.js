import React from 'react';
import { useParams } from "react-router-dom";

import Action from './../containers/Action.js';

function ActionRouter() {
  let { actionToken } = useParams();
  return (
    <Action actionToken={actionToken} />
  );
}

export default ActionRouter;