import React from 'react';
import { Switch, Route, useRouteMatch, useParams } from "react-router-dom";

import Adventures from './../containers/Adventures.js';

function AdventuresInnerRouter() {
  let { sort, page } = useParams();
  return (
    <Adventures sort={sort} page={page} />
  )
}
function AdventuresRouter() {
  let match = useRouteMatch();
  return (
    <Switch>
      <Route path={`${match.path}/:sort/:page`} component={AdventuresInnerRouter} />
    </Switch>
  );
}

export default AdventuresRouter;