import React from 'react';
import { useParams } from "react-router-dom";

import AdventureView from './../containers/AdventureView.js';

function AdventureViewRouter() {
  let { adventureId } = useParams();
  return (
    <AdventureView adventureId={adventureId} />
  );
}

export default AdventureViewRouter;