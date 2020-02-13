import React from 'react';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import isEqual from "react-fast-compare";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {SortableContainer, SortableElement, sortableHandle} from 'react-sortable-hoc';
import { spacing } from '@material-ui/system';
import MuiAlert from '@material-ui/lab/Alert';
import { MuiThemeProvider, Snackbar, CircularProgress, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Box, Drawer, IconButton, ButtonGroup, TextField, Input, InputAdornment, AppBar, Toolbar, Paper, Card, CardActions, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Fab, FormControlLabel, Menu, MenuItem, Typography, CssBaseline } from '@material-ui/core';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { createMuiTheme, withStyles } from '@material-ui/core/styles';
import { Visibility, Save, Lock, LockOpen, Add, Edit, Link as LinkIcon, Unlink, Delete as DeleteIcon, Undo, Redo, DragHandle, More, MoreVert, PlayForWork, Flight, MergeType, CallSplit, QuestionAnswerOutlined, QuestionAnswer, Done, AddBox, CheckCircle, Inbox, MenuSharp, Home, ArrowBack } from '@material-ui/icons';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  withRouter,
  useRouteMatch,
  useParams,
  useHistory
} from "react-router-dom";
import Draggable, {DraggableCore} from 'react-draggable';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import arrayMove from 'array-move';

import Util from '../Util.js';

import config from 'react-global-configuration';

import Question from './AdventureBuilder/Question.js';

import { connect } from "react-redux";
import { 
  setConfirmDialog, 
  setQuietAlertDialog,
  setAdventureBuilder,
  setAdventureBuilderQuestion
} from "./../action";

class AdventureBuilder extends React.Component {
  constructor(props) {
    super(props);

    this.positionX = 0;
    this.positionY = 0;
    this.scale = 1;
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
  }
  processSave(res) {
    let o = this;
    if(res.status != 200) {
      o.props.dispatch(setQuietAlertDialog({
        open: true,
        severity: "error",
        description: Util.translation['ErrServerResponse']
      }));
    }
    if(res.data.status != "success") {
      if(res.data.errors.length == 0) {
        o.props.dispatch(setQuietAlertDialog({
          open: true,
          severity: "error",
          description: Util.translation['ErrUnknown']
        }));
      }
      let st = cloneDeep(o.state.meta);
      for(let i = 0; i < res.data.errors.length; i++) {
        if(typeof(st[res.data.errors[i]['target']]) != 'undefined') {
          let it = Object.assign({}, st[res.data.errors[i]['target']]);
          it['error'] = Util.translation[res.data.errors[i]['code']];
          st[res.data.errors[i]['target']] = it;
          o.setState({
            metaDialogOpen: true,
            meta: st
          });
        } else {
          o.props.dispatch(setQuietAlertDialog({
            open: true,
            severity: "error",
            description: Util.translation[res.data.errors[i]['code']]
          }));
        }
        if(res.data.errors[i]['code'] == "ErrNotAuthorized") {
          //unset cookie and then refresh - token is invalid
          Util.removeCookie("accessToken");
          window.location.reload(true);
        }
      }
    }

    let saved = false;
    if(res.data.status == "success") {
      saved = true;
      this.props.dispatch(setQuietAlertDialog({
        open: true,
        severity: "success",
        description: Util.translation["SuccAdventureSaved"]
      }));
    }
    return saved;
  }
  save() {
    let data = cloneDeep(this.props.questions);
    for(let i in data) {
      data[i]['element'] = null;
      for(let j in data[i]['answers']) {
        data[i]['answers'][j]['element'] = null;
        data[i]['answers'][j]['questionRef'] = null;
      }
    }
    let params = {};
    params['data'] = data;
    params['view'] = {
      x: this.positionX,
      y: this.positionY,
      scale: this.scale
    }
    params['meta'] = {
      title: this.props.meta.title.value,
      description: this.props.meta.description.value
    }
    let o = this;

    o.props.dispatch(setAdventureBuilder({
      status: {
        loading: true
      }
    }));

    //are we creating a new adventure or updating an existing one?
    let url = `${config.get("apiHost")}/api/adventure`;
    if(this.props.adventureId == null) {
      axios.post(`${config.get("apiHost")}/api/adventure`, params)
        .then(res => {
          let saved = o.processSave(res);
          let adventureId = null;
          if(saved && typeof(res['data']['data']['adventureId']) != 'undefined') {
            adventureId = res['data']['data']['adventureId'];
          }
          o.setState({
            status: {
              saved: saved,
              loading: false
            },
            adventureId: adventureId
          });
        });
    } else {
      axios.put(`${config.get("apiHost")}/api/adventure/${this.props.adventureId}`, params)
        .then(res => {
          let saved = o.processSave(res);
          o.setState({
            status: {
              saved: saved,
              loading: false
            }
          });
        });
    }
  }
  getOffset(canvas, childrenEl) {
    let canv = canvas.getBoundingClientRect();
    let box = childrenEl.getBoundingClientRect();
  
    return {
        top: box.top - canv.top,
        left: box.left - canv.left,
        width: childrenEl.offsetWidth * this.scale,
        height: childrenEl.offsetHeight * this.scale
    };
  }
  drawArrow(ctx, fromx, fromy, tox, toy) {
    let headlen = 10 * this.scale;
    let angle = Math.atan2(toy-fromy,tox-fromx);
    ctx.beginPath();
    ctx.strokeStyle = Util.theme.theme.palette.secondary.main;
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineWidth = 2 * this.scale;
    ctx.stroke();
    ctx.lineWidth = 6 * this.scale;
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));
    ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/7),toy-headlen*Math.sin(angle+Math.PI/7));
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));
    ctx.stroke();
  }
  
  getCenterCoord(coods) {

    return {
        x: coods.left + coods.width / 2,
        y: coods.top + (coods.height / 2)
    }
  }
  getAngleCoord(r, c, angle) {
    let x, y;
    let rAngle = Math.acos(Math.sqrt(Math.pow(r.left + r.width - c.x, 2)) / Math.sqrt(Math.pow(r.left + r.width - c.x, 2) + Math.pow(r.top - c.y, 2)));
  
    if (angle >= 2 * Math.PI - rAngle || angle < rAngle) {
      x = r.left + r.width;
      y = c.y + Math.tan(angle) * (r.left + r.width - c.x);
    } else {
      if (angle >= rAngle && angle < Math.PI- rAngle) {
        x = c.x - ((r.top - c.y) / Math.tan(angle));
        y = r.top + r.height;
      } else {
        if (angle >= Math.PI - rAngle && angle < Math.PI + rAngle) {
          x = r.left;
          y = c.y - Math.tan(angle) * (r.left + r.width - c.x);
        } else {
          if (angle >= Math.PI + rAngle) {
            x = c.x + ((r.top - c.y) / Math.tan(angle));
            y = r.top;
          }
        }
      }
    }
    return {
      x: x,
      y: y
    };
  }
  getEllipseCoord(r, c, angle) {
    return {
      x: c.x + (r.width / 2) * Math.cos(angle),
      y: c.y + (r.height / 2) * Math.sin(angle)
    };
  }
  
  renderVisualizations() {
    var canvas = document.getElementById("visualizations");
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const questions = Object.assign({}, this.props.questions);

    for(const i in questions) {
      if(questions[i]['start'] == true && typeof(questions[i]['element']) != 'undefined' && questions[i]['element'] != null) {
        let dot = this.getOffset(canvas, questions[i]['element']);
        let c = this.getCenterCoord(dot);

        let textY = c.y - dot.height / 2 - (70 * this.scale);
        //let textX = c.x - 
        let textX = c.x - (dot.width - (80 * this.scale)) / 2 + 160 * this.scale - (30 * this.scale);

        let eleY = textY + (60 * this.scale);
        ctx.beginPath();
        ctx.fillStyle = Util.theme.theme.palette.secondary.main;
        let fontSize = Math.round(22 * this.scale);
        ctx.font = "bold "+fontSize+"px Roboto";
        ctx.fillText('START', textX, textY);
        ctx.fill();
        ctx.closePath();
  
        let fL = c.x;
        let fT = textY + (10 * this.scale);
        let tL = c.x;
        let tT = eleY;

        this.drawArrow(ctx, fL, fT, tL, tT);
      }
      for(const j in questions[i]['answers']) {
        if(questions[i]['answers'][j]['linkedTo'] != null) {
          if(typeof(questions[i]['answers'][j]['element']) == 'undefined') {
            break;
          }
          if(typeof(questions[questions[i]['answers'][j]['linkedTo']]) == 'undefined') {
            break;
          }
          let from = questions[i]['answers'][j]['element'];
          let to = questions[questions[i]['answers'][j]['linkedTo']]['element'];
          if(from == null || to == null) {
            break;
          }
          let dot1 = this.getOffset(canvas, from);
          let dot2 = this.getOffset(canvas, to);
  
          dot2.top -= 8 * this.scale;
          dot2.left -= 8 * this.scale;
          dot2.width += 16 * this.scale;
          dot2.height += 16 * this.scale;
  
          let c1 = this.getCenterCoord(dot1);
          let c2 = this.getCenterCoord(dot2);
          dot1 = this.getEllipseCoord(dot1, c1, Math.atan2(c2.y - c1.y, c2.x - c1.x));
          dot2 = this.getAngleCoord(dot2, c2, Math.atan2(c2.y - c1.y, c2.x - c1.x) + Math.PI);

          let fL = dot1.x;
          let fT = dot1.y;
          let tL = dot2.x;
          let tT = dot2.y;
  
          this.drawArrow(ctx, fL, fT, tL, tT);
        }
      }
    }
    ctx.stroke();
  }
  setQuestion(k, params) {
    const questions = Object.assign({}, this.props.questions);
    //const questions = current.questions.slice();
    if(k != null && params == null) {
      //deleting
      //unlink linked answers
      for(const x in questions[k]['linkedFrom']) {
        var tmp = x.split(",");
        let questionIndex = tmp[0];
        let answerIndex = tmp[1];
        questions[questionIndex]['answers'][answerIndex]['linkedTo'] = null;
      }
      delete questions[k];
    } else if(k == null && params == null) {
      //creating
      k = Util.uuidv1();
      //k = questions.length;
      let x = (-this.positionX + this.viewportWidth / 2) - (200 * this.scale);
      let y = (-this.positionY + this.viewportHeight / 2) - (100 * this.scale);
      x /= this.scale;
      y /= this.scale;
      params = {
        index: k,
        position: {
          x: x,
          y: y
        },
        text: "",
        linking: false,
        linkedFrom: {},
        answers: {},
        start: false
      };
      if(Object.keys(questions).length == 0) {
        params['start'] = true;
      }
      questions[k] = params;
    } else {
      //updating
      if(typeof(questions[k]) != 'undefined') {
        if(questions[k]['start'] == false && params['start'] == true) {
          for(var i in questions) {
            questions[i]['start'] = false;
          }
        }
      } else {
        //params['linkedFrom'] = {};
        //params['answers'] = {};
      }
      questions[k] = params;
    }
    this.props.dispatch(setAdventureBuilderQuestion(k, params));
  }
  renderQuestions(questions) {
    let questionComponents = [];
    //check for deletions
    
    for(const i in questions) {
      for(const x in questions[i]['linkedFrom']) {
        var tmp = x.split(",");
        let questionIndex = tmp[0];
        let answerIndex = tmp[1];
        if(typeof(questions[questionIndex]) == 'undefined' || typeof(questions[questionIndex]['answers'][answerIndex]) == 'undefined' || questions[questionIndex]['answers'][answerIndex]['linkedTo'] != i) {
          //linked answer no longer exists, or does not contain link back - unlink from question
          delete questions[i]['linkedFrom'][x];
        }
      }
    }
    
    for(const i in questions) {
      questionComponents.push(
        <Question
          key={i}
          index={i}
          set={(i, params) => this.setQuestion(i, params)}
          setLink={(params) => this.setLink(params)}
          renderVisualizations={(params) => this.renderVisualizations(params)}
          linking={this.props.linking}
          scale={this.scale}
          params={questions[i]}>
        </Question>
      );
    }
    this.questions = questions;
    this.questionComponents = questionComponents;
    return questionComponents;
  }
  setLink = (params) => {
    const questions = Object.assign({}, this.props.questions);
    let linking = Object.assign({}, this.props.linking);
    if(typeof(params['from']) != 'undefined') {
      //coming from answer
      linking.from = params['from'];
    }
    if(typeof(params['to']) != 'undefined') {
      //coming from question
      if(params['to'] == null) {
        
      } else {
        linking.to = params['to'];
      }
    }
    if(typeof(params['preview']) != 'undefined') {
      //coming from question
      linking.preview = params['preview'];
    }
    if(typeof(linking.from) != 'undefined' && typeof(linking.to) != 'undefined' && params['to'] != null) {
      let q = Object.assign({}, questions[linking.to]);
      q['linkedFrom'][linking.from] = true;
      this.setQuestion(linking.to, q, true);
      let tmp = linking.from.split(",");
      let questionIndex = tmp[0];
      let answerIndex = tmp[1];
      let a = Object.assign({}, questions[questionIndex]['answers'][answerIndex]);
      a['linkedTo'] = linking.to;
      let q2 = Object.assign({}, questions[questionIndex]);
      q2['answers'][answerIndex] = a;
      this.setQuestion(questionIndex, q2, true);
      if(!linking.preview) {
        delete linking.to;
        delete linking.from;
      }
    } else if(params['to'] == null && typeof(linking.to) != 'undefined') {
      //remove link
      let q = Object.assign({}, questions[linking.to]);
      delete q['linkedFrom'][linking.from];
      this.setQuestion(linking.to, q);
      let tmp = linking.from.split(",");
      let questionIndex = tmp[0];
      let answerIndex = tmp[1];
      let a = Object.assign({}, questions[questionIndex]['answers'][answerIndex]);
      a['linkedTo'] = null;
      let q2 = Object.assign({}, questions[questionIndex]);
      q2['answers'][answerIndex] = a;
      this.setQuestion(questionIndex, q2, true);
      delete linking.to;
    } else if(typeof(linking.from) != 'undefined') {

    }
    
    this.setState({
      linking: linking
    });
  }
  componentDidUpdate() {
    this.renderVisualizations();
  }
  displayChanged(e, data) {

    //console.log(e);
    this.positionX = e.positionX;
    this.positionY = e.positionY;
    this.scale = e.scale;

    this.renderVisualizations();
  }

  componentDidMount() {
    if(this.props.adventureId != null) {
      let adventureId = this.props.adventureId;
      let params = {};
      let o = this;
      axios.get(`${config.get("apiHost")}/api/adventure/${adventureId}`, params)
        .then(res => {
          let ret = Util.processRequestReturnSilent(res);
          if(!ret) {
            return;
          }
          let data = res['data']['data'];
          let adventure = data['adventure'];

          let questions = adventure['data'];
          for(let i in questions) {
            /*
            let answers = Object.assign({}, questions[i]['answers']);
            questions[i]['answers'] = {};
            for(let j in answers) {
              questions[i]['answers'][j] = cloneDeep(answers[j]);
            }
            */
            let question = cloneDeep(questions[i]);
            //question['answers'] = questions[i]['answers'];
            //question['answers'] = reverseObject(question['answers']);
            //question['answers'] = {};
            o.setQuestion(i, question);
          }
          /*
          for(let i in questions) {
            o.setQuestion(i, questions[i]);
          }
          */

          this.positionX = adventure['view']['x'];
          this.positionY = adventure['view']['y'];
          this.scale = adventure['view']['scale'];
          
          //console.log(this.state.questions);
          o.props.dispatch(setAdventureBuilder({
            status: {
              loading: false
            },
            meta: {
              title: {
                value: adventure['meta']['title'],
                error: null
              },
              description: {
                value: adventure['meta']['description'],
                error: null
              }
            },
            view: adventure['view']
          }));
        });
    } else {
      this.props.dispatch(setAdventureBuilder({
        metaDialogOpen: true,
        status: {
          loading: false
        }
      }));
      this.setQuestion(null, null);
    }
  }

  setMeta(key, value) {
    let st = cloneDeep(this.props.meta);
    st[key]['error'] = null;
    st[key]['value'] = value;
    this.props.dispatch(setAdventureBuilder({
      meta: st,
      status: {
        saved: false
      }
    }));
  }

  handleMetaDialogOpen() {
    this.props.dispatch(setAdventureBuilder({
      metaDialogOpen: true
    }));
  }

  handleMetaDialogClose() {
    this.props.dispatch(setAdventureBuilder({
      metaDialogOpen: false
    }));
  }
  /*
  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(this.props, nextProps);
  }
  */
  render() {
    let baseOptions = {
      minScale: 0.2,
      maxScale: 1,
      limitToBounds: false,
      centerContent: false
    }
    let panOptions = {
      disabled: false
    }
    let zoomInOptions = {
      step: 70
    }
    let zoomOutOptions = {
      step: 70
    }
    let wheelOptions = {
      step: 100
    }

    const divStyle = {
      marginTop: '64px',
    };

    let loaderClass = "loader";
    if(this.props.status.loading) {
      loaderClass += " loading";
    }

    return (
      <div>
        <AppBar color="default" position="fixed" className="secondaryToolbar">
          <Toolbar>
            <Grid
              justify="space-between"
              container>
              <Grid item>
                <Button color="primary" 
                  key="actionAdd"
                  onClick={() => this.setQuestion(null, null)}>
                  <AddBox /> &nbsp; Add
                </Button>
              </Grid>
              <Grid item>
                <Button color="primary"
                  className="editMetaBtn"
                  key="actionEditMeta"
                  disabled={this.props.metaDialogOpen}
                  onClick={() => this.handleMetaDialogOpen()}>
                  <Edit /> &nbsp; 
                  <span className="editMetaBtnLabel">
                    {this.props.meta.title.value || "Edit Info"}
                  </span>
                </Button>
                &nbsp;
                &nbsp;
                &nbsp;
                <Button color="secondary" 
                  key="actionSave"
                  disabled={this.props.status.saved}
                  onClick={() => this.save()}>
                  <Save /> &nbsp; Save
                </Button>
                <Link to="/adventures" className="link">
                  <Button color="default" 
                    key="actionCancel"
                    onClick={() => this.setQuestion(null, null)}>
                    <Done /> &nbsp; Done
                  </Button>
                </Link>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
        <div className="pane">
          <div className={loaderClass}>
            <CircularProgress color="secondary" disableShrink />
          </div>
          <TransformWrapper 
            onWheel={(e, data) => this.displayChanged(e, data)}
            onPanning={(e, data) => this.displayChanged(e, data)}
            onPinching={(e, data) => this.displayChanged(e, data)}
            onZoomChange={(e, data) => this.displayChanged(e, data)}
            positionX={this.positionX}
            positionY={this.positionY}
            scale={this.scale}
            options={baseOptions}
            pan={panOptions} 
            zoomIn={zoomInOptions} 
            zoomOut={zoomOutOptions} 
            wheel={wheelOptions}>
            <TransformComponent>
              <div className="questions">
                {this.renderQuestions(this.props.questions)}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
        <Dialog open={this.props.metaDialogOpen} onClose={() => this.handleMetaDialogClose()}>
          <DialogContent>
            { this.props.adventureId == null && 
              <DialogContentText>
                Welcome to the adventure builder! Enter a name and description for your adventure then press the continue button to start building.
              </DialogContentText>
            }
            <Grid container>
              <Grid item xs={12}>
                <Box mb={3} mt={3}>
                  <TextField id="fieldAdventureTitle" label="Name of Adventure" required type="text" fullWidth autoFocus={this.props.adventureId == null}
                    value={this.props.meta.title.value}
                    error={this.props.meta.title.error != null}
                    helperText={this.props.meta.title.error}
                    onChange={e => this.setMeta("title", e.target.value)} 
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box mb={3}>
                  <TextField id="fieldAdventureDescription" label="Description" type="text" fullWidth multiline
                    value={this.props.meta.description.value}
                    error={this.props.meta.description.error != null}
                    helperText={this.props.meta.description.error}
                    onChange={e => this.setMeta("description", e.target.value)} 
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.handleMetaDialogClose()} color="primary">
              Continue
            </Button>
          </DialogActions>
        </Dialog>
        <canvas id="visualizations"></canvas>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const props = cloneDeep(state.builder);
  //const props = Object.assign({}, state.builder);
  return props;
};

export default connect(mapStateToProps)(AdventureBuilder);