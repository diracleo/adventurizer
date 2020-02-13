import React from 'react';
import { Route, Redirect } from "react-router-dom";

import Util from './../../Util.js';

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(props) => (
    Util.Auth.isAuthenticated === true
      ? <Component {...props} />
      : <Redirect to={{
          pathname: '/login',
          state: { from: props.location }
        }} />
  )} />
)

export default PrivateRoute;