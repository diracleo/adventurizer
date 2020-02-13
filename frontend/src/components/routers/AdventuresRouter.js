import React from 'react';
import { Switch, Route, useRouteMatch } from "react-router-dom";

import AdventureBuildRouter from './../routers/AdventureBuildRouter.js';
import Adventures from './../containers/Adventures.js';

function AdventuresRouter() {
  let match = useRouteMatch();
  
  return (
    <Switch>
      <Route path={`${match.path}/build/:adventureId`}>
        <div className="content">
          <AdventureBuildRouter />
        </div>
      </Route>
      <Route path={`${match.path}/build`}>
        <div className="content">
          <AdventureBuildRouter />
        </div>
      </Route>
      <Route path={match.path} component={Adventures}>
        
      </Route>
    </Switch>
  );
}

export default AdventuresRouter;