import React from 'react';
import { Switch, Route, useRouteMatch, useParams } from "react-router-dom";

import Search from './../containers/Search.js';

function SearchInnerRouter() {
  let { sort, page } = useParams();
  return (
    <Search sort={sort} page={page} />
  )
}
function SearchRouter() {
  let match = useRouteMatch();
  return (
    <Switch>
      <Route path={`${match.path}/:sort/:page`} component={SearchInnerRouter} />
    </Switch>
  );
}

export default SearchRouter;