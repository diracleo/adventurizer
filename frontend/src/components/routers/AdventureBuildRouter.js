import React from 'react';
import { useParams } from "react-router-dom";

import AdventureBuilder from './../containers/AdventureBuilder.js';

function AdventureBuildRouter() {
  let { adventureId } = useParams();
  return (
    <AdventureBuilder adventureId={adventureId} />
  );
}

export default AdventureBuildRouter;