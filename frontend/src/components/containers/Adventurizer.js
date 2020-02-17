import React from 'react';
import { Helmet } from "react-helmet";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { MuiThemeProvider, CssBaseline, AppBar, Toolbar, Grid, Box, IconButton, Typography, Drawer, List, ListItem, ListItemText, ListItemIcon } from '@material-ui/core';
import { LockOpen, Home, Search as SearchIcon, Edit, TrendingUp, Settings as SettingsIcon, Lock, MenuSharp, PersonAdd } from '@material-ui/icons';
import { BrowserRouter as Router, Switch, Route, Link, Redirect, withRouter, useRouteMatch, useParams, useHistory } from "react-router-dom";
import { connect } from "react-redux";
import { toggleMainMenu } from "./../../action";

import AdventuresRouter from './../routers/AdventuresRouter.js';
import AdventureViewRouter from './../routers/AdventureViewRouter.js';
import PrivateRoute from './../modules/PrivateRoute.js';
import ConfirmDialog from './../modules/ConfirmDialog.js';
import QuietAlertDialog from './../modules/QuietAlertDialog.js';
import Signup from './../containers/Signup.js';
import Login from './../containers/Login.js';
import ForgotPassword from './../containers/ForgotPassword.js';
import Dashboard from './../containers/Dashboard.js';
import Progress from './../containers/Progress.js';
import Settings from './../containers/Settings.js';
import ChangeEmail from './../containers/ChangeEmail.js';
import ChangePassword from './../containers/ChangePassword.js';
import ActionRouter from './../routers/ActionRouter.js';
import UnsubRouter from './../routers/UnsubRouter.js';
import SearchRouter from './../routers/SearchRouter.js';
import TermsOfUse from './../containers/TermsOfUse.js';
import PrivacyPolicy from './../containers/PrivacyPolicy.js';
import SignoutBtn from './../modules/SignoutBtn.js';
import Util from './../../Util.js';
import config from 'react-global-configuration';
import './../../sass/app.scss';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  config.set({ 
    apiHost: "http://127.0.0.1:5000",
    webHost: "http://localhost:3000"
  });
} else {
  config.set({ 
    apiHost: "https://api.adventurizer.net",
    webHost: "https://adventurizer.net"
  });
}

class Adventurizer extends React.Component {
  constructor(props) {
    super(props);
    Util.Auth.check();
  }
  handleToggleMainMenu = (open) => event => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    this.props.dispatch(toggleMainMenu(open));
  }
  checkAction(event) {

  }
  renderUtils() {
    let ret = [];
    ret.push(
      <ConfirmDialog key="confirmDialog" 
        open={this.props.utils.confirmDialog.open}
        title={this.props.utils.confirmDialog.title} 
        description={this.props.utils.confirmDialog.description} 
        confirmCallback={this.props.utils.confirmDialog.confirmCallback} 
      />
    );
    ret.push(
      <QuietAlertDialog key="quietAlertDialog" 
        open={this.props.utils.quietAlertDialog.open}
        severity={this.props.utils.quietAlertDialog.severity}
        description={this.props.utils.quietAlertDialog.description}
      />
    );
    return ret;
  }
  renderMainMenu() {
    let items = [];
    if(Util.Auth.isAuthenticated) {
      items.push(
        <Link to="/" className="link" key="mainMenuDashboardLink">
          <ListItem button key="mainMenuDashboardBtn">
            <ListItemIcon><Home /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
        </Link>
      );
      items.push(
        <Link to="/search/trending/1" className="link" key="mainMenuSearchLink">
          <ListItem button key="mainMenuSearchBtn">
            <ListItemIcon><SearchIcon /></ListItemIcon>
            <ListItemText primary="Explore Adventures" />
          </ListItem>
        </Link>
      );
      items.push(
        <Link to="/adventures" className="link" key="mainMenuAdventuresLink">
          <ListItem button key="mainMenuAdventuresBtn">
            <ListItemIcon><Edit /></ListItemIcon>
            <ListItemText primary="My Adventures" />
          </ListItem>
        </Link>
      );
      items.push(
        <Link to="/progress" className="link" key="mainMenuProgressLink">
          <ListItem button key="mainMenuProgressBtn">
            <ListItemIcon><TrendingUp /></ListItemIcon>
            <ListItemText primary="My Progress" />
          </ListItem>
        </Link>
      );
      items.push(
        <Link to="/settings" className="link" key="mainMenuSettingsLink">
          <ListItem button key="mainMenuSettingsBtn">
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </Link>
      );
      items.push(
        <SignoutBtn key="mainMenuSignoutLinkOuter" />
      );
    } else {
      items.push(
        <Link to="/" className="link" key="mainMenuDashboardLink">
          <ListItem button key="mainMenuDashboardBtn">
            <ListItemIcon><Home /></ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
        </Link>
      );
      items.push(
        <Link to="/search/trending/1" className="link" key="mainMenuSearchLink">
          <ListItem button key="mainMenuSearchBtn">
            <ListItemIcon><SearchIcon /></ListItemIcon>
            <ListItemText primary="Explore Adventures" />
          </ListItem>
        </Link>
      );
      items.push(
        <Link to="/login" className="link" key="mainMenuSigninLink">
          <ListItem button key="mainMenuSigninBtn">
            <ListItemIcon><Lock /></ListItemIcon>
            <ListItemText primary="Sign In" />
          </ListItem>
        </Link>
      );
      items.push(
        <Link to="/signup" className="link" key="mainMenuSignupLink">
          <ListItem button key="mainMenuSigninBtn">
            <ListItemIcon><PersonAdd /></ListItemIcon>
            <ListItemText primary="Sign Up" />
          </ListItem>
        </Link>
      );
    }
    return items;
  }

  render() {
    return (
      <MuiThemeProvider theme={Util.theme.theme}>
        <Helmet>
          <meta charSet="utf-8" />
          <title>Adventurizer</title>
          <meta name="description" content="Build your own adventures" />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
          <link rel="manifest" href="/favicon/site.webmanifest" />
        </Helmet>
        <CssBaseline />
        <Router>
          <div id="app" className="app" onClick={(ev) => this.checkAction(ev)}>
            { this.props.viewType != "fullscreen" && 
              <AppBar color="primary" position="fixed">
                <Toolbar>
                  <Grid
                    justify="space-between"
                    container>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center">
                        <IconButton edge="start" color="inherit" aria-label="menu" onClick={this.handleToggleMainMenu(true)}>
                          <MenuSharp />
                        </IconButton>
                        <Typography variant="h1" className="logo">
                          ADVENTURIZER
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>

                    </Grid>
                  </Grid>
                </Toolbar>
              </AppBar> 
            }
            <Switch>
              <Route path="/a/:adventureId" component={AdventureViewRouter} />
              <Route path="/search" component={SearchRouter} />
              <Route path="/terms" component={TermsOfUse} />
              <Route path="/privacy" component={PrivacyPolicy} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Signup} />
              <Route path="/forgotPassword" component={ForgotPassword} />
              <Route path="/action/:actionToken" component={ActionRouter} />
              <Route path="/unsub/:unsubToken" component={UnsubRouter} />
              <PrivateRoute path="/adventures" component={AdventuresRouter} />
              <PrivateRoute path="/progress" component={Progress} />
              <PrivateRoute path="/settings" component={Settings} />
              <PrivateRoute path="/changeEmail" component={ChangeEmail} />
              <PrivateRoute path="/changePassword" component={ChangePassword} />
              <Route path="/" component={Dashboard} />
            </Switch>
            <Drawer open={this.props.menus.main} onClose={this.handleToggleMainMenu(false)}>
              <div
                className="mainMenu" 
                role="presentation"
                onClick={this.handleToggleMainMenu(false)}
                onKeyDown={this.handleToggleMainMenu(false)}
              >
                <List>
                  {this.renderMainMenu()}
                </List>
              </div>
            </Drawer>
            {this.renderUtils()}
          </div>
        </Router>
      </MuiThemeProvider>
    );
  }
}

const mapStateToProps = state => {
  const menus = Object.assign({}, state.menus);
  const utils = Object.assign({}, state.utils);
  let viewType = state.viewType;
  return {
    viewType: viewType,
    menus: menus,
    utils: utils
  }
};

export default connect(mapStateToProps)(Adventurizer);