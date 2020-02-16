import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Grid, Box, Button } from '@material-ui/core';
import { Link } from "react-router-dom";
import Util from './../../Util.js';
import config from 'react-global-configuration';

import AdventuresList from './../modules/AdventuresList.js';
import ProgressList from './../modules/ProgressList.js';
import SearchList from './../modules/SearchList.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';
import Footer from './../modules/Footer.js';

import { connect } from "react-redux";
import { setConfirmDialog, setViewType } from "./../../action";

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: [],
      status: {
        loading: true
      }
    }
    this.props.dispatch(setViewType("normal"));

    Util.Auth.check();
  }
  render() {
    return (
      <div>
        <div className="content contentFilled">
          { !Util.Auth.isAuthenticated && 
            <div className="widget widgetEdge">
              <div className="promo">
                <div>
                  <h1>
                    Build your own adventures
                    <br/>
                    Discover new adventures
                  </h1>
                  <Link to={`/signup`} className="link">
                    <Button color="primary" variant="contained" size="large">
                      Create Free Account
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          }
          { Util.Auth.isAuthenticated && 
            <div className="widget">
              <div className="header">
                <Grid
                  justify="space-between"
                  container>
                  <Grid item md={6}>
                    <Box display="flex" alignItems="left">
                      <h2>
                        <Link to={`/adventures`} className="link">My Adventures</Link>
                      </h2>
                    </Box>
                  </Grid>
                  <Grid item md={6}>
                    <Box display="flex" alignItems="right" className="actions">
                      <Link to={`/adventures`} className="link">
                        <Button color="primary">
                          See All
                        </Button>
                      </Link>
                    </Box>
                  </Grid>
                </Grid>
              </div>
              <div className="area">
                <AdventuresList pagination={false} limit={4} />
              </div>
            </div>
          }
          { Util.Auth.isAuthenticated && 
            <div className="widget">
              <div className="header">
                <Grid
                  justify="space-between"
                  container>
                  <Grid item md={6}>
                    <Box display="flex" alignItems="left">
                      <h2>
                        <Link to={`/progress`} className="link">My Progress</Link>
                      </h2>
                    </Box>
                  </Grid>
                  <Grid item md={6}>
                    <Box display="flex" alignItems="right" className="actions">
                      <Link to={`/progress`} className="link">
                        <Button color="primary">
                          See All
                        </Button>
                      </Link>
                    </Box>
                  </Grid>
                </Grid>
              </div>
              <div className="area">
                <ProgressList pagination={false} limit={4} />
              </div>
            </div>
          }
          { typeof(this.state.search) != 'undefined' && 
            <div className="widget">
              <div className="header">
                <Grid
                  justify="space-between"
                  container>
                  <Grid item md={6}>
                    <Box display="flex" alignItems="left">
                      <h2>
                        <Link to={`/search/trending/1`} className="link">Explore Adventures</Link>
                      </h2>
                    </Box>
                  </Grid>
                  <Grid item md={6}>
                    <Box display="flex" alignItems="right" className="actions">
                      <Link to={`/search/trending/1`} className="link">
                        <Button color="primary">
                          See All
                        </Button>
                      </Link>
                    </Box>
                  </Grid>
                </Grid>
              </div>
              <div className="area">
                <SearchList sort="trending" page={1} pagination={false} limit={8} />
              </div>
            </div>
          }
        </div>
        <Footer />
      </div>
    );
  }
}

const mapStateToProps = state => {
  const props = cloneDeep(state);
  return props;
};
export default connect(mapStateToProps)(Dashboard);