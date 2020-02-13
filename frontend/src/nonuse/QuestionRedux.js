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

import Util from '../../Util.js';

import config from 'react-global-configuration';

import Answer from './Answer.js';

import { connect } from "react-redux";
import { 
  setConfirmDialog, 
  setQuietAlertDialog,
  setAdventureBuilder,
  setAdventureBuilderQuestion,
  setAdventureBuilderQuestionAnswer
} from "./../../action";

const SortableItem = SortableElement(({value}, {index}) => 
  <li key={`listitem-${value.index}`} className="answerItem">
    <Answer
      key={value.index}
      index={value.index}
      questionIndex={value.questionRef.props.index}
      set={(index, params) => value.questionRef.setAnswer(index, params)}
      setLink={(params) => value.questionRef.props.setLink(params)}
      params={value}>
    </Answer>
  </li>
);
const SortableList = SortableContainer(({items}) => {
  let answersArray = [];
  for(var i in items) {
    //answersArray.push(items[i]);
    answersArray[items[i]['num']] = items[i];
  }
  return (
    <ul className="answerItems">
      {answersArray.map((value, index) => (
        <SortableItem key={`item-${value.index}`} index={index} value={value} />
      ))}
    </ul>
  );
});

class Question extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    const answers = Object.assign({}, this.props.params.answers);
    for(let i in answers) {
      if(answers[i]['questionRef'] == null) {
        this.setAnswer(i, answers[i]);
      }
    }
  }
  handleMoveStart(e, data) {
    e.stopPropagation();
    let params = Object.assign({}, this.props.params);
    params['position'] = {
      x: data.x,
      y: data.y
    };
    this.props.dispatch(setAdventureBuilderQuestion(this.props.index, params));
    //this.props.set(this.props.index, params);
  }
  handleMoveStop(e, data) {
    e.stopPropagation();
    let params = Object.assign({}, this.props.params);
    params['position'] = {
      x: data.x,
      y: data.y
    };
    this.props.dispatch(setAdventureBuilderQuestion(this.props.index, params));
    //this.props.set(this.props.index, params);
  }
  handleDelete() {
    this.props.set(this.props.index, null);
  }
  handleTextSubmit(e) {
    let params = Object.assign({}, this.props.params);
    params['text'] = e.target.value;
    this.props.dispatch(setAdventureBuilderQuestion(this.props.index, params));
    //this.props.set(this.props.index, params, false);
  }
  handleTextUpdate(e) {
    let params = Object.assign({}, this.props.params);
    params['text'] = e.target.value;
    this.props.dispatch(setAdventureBuilderQuestion(this.props.index, params));
    //this.props.set(this.props.index, params, true);
  }
  handleSetAsStart(e) {
    let params = Object.assign({}, this.props.params);
    params['start'] = true;
    this.props.dispatch(setAdventureBuilderQuestion(this.props.index, params));
    //this.props.set(this.props.index, params, false);
  }
  handleAddAnswer() {
    this.setAnswer(null, null);
  }
  handleClick(e) {
    e.stopPropagation();
  }
  setAnswer(k, params) {
    //const answers = this.props.params.answers.slice();
    const answers = Object.assign({}, this.props.params.answers);
    if(k != null && params == null) {
      //deleting
      //must delete linked question in parent
      //delete answers[k];
    } else if(k == null && params == null) {
      //creating
      k = Util.uuidv1();
      //k = this.props.params.answers.length;
      let num = 0;
      for(let i in answers) {
        if(answers[i]['num'] > num) {
          num = answers[i]['num'];
        }
      }
      num++;
      params = {
        num: num,
        text: "",
        index: k,
        questionRef: this
      };
      //answers[k] = params;
    } else {
      //updating
      params['questionRef'] = this;
      //answers[k] = params;
    }
    //var pParams = Object.assign({}, this.props.params);
    //pParams['answers'] = answers;
    this.props.dispatch(setAdventureBuilderQuestionAnswer(this.props.index, k, params));
    //this.props.set(this.props.index, pParams);
  }
  onSortEnd = ({oldIndex, newIndex}) => {
    let params = Object.assign({}, this.props.params);
    let answers = Object.assign({}, params['answers']);
    let answersArray = [];
    for(var i in answers) {
      answersArray.push(answers[i]);
    }
    answersArray = arrayMove(answersArray, oldIndex, newIndex);
    let answersNew = {};
    for(var i = 0; i < answersArray.length; i++) {
      answersNew[answersArray[i]['index']] = answersArray[i];
      answersNew[answersArray[i]['index']]['num'] = i;
    }
    params['answers'] = answersNew;
    this.props.dispatch(setAdventureBuilderQuestion(this.props.index, params));
    //this.props.set(this.props.index, params);
  };
  onSortMove = (event) => {
    //this.props.renderVisualizations();
  }
  renderAnswers(answers) {
    let refee = this;

    let c = document.getElementById("app");
    return <SortableList items={answers} onSortEnd={this.onSortEnd} onSortMove={this.onSortMove} hideSortableGhost={false} useDragHandle helperContainer={c} />
  }
  stopLink() {
    let params = {};
    params['to'] = this.props.index;
    params['preview'] = false;
    //this.props.setLink(params);
  }
  previewLink() {
    let params = {};
    params['to'] = this.props.index;
    params['preview'] = true;
    //this.props.setLink(params);
  }
  unpreviewLink() {
    let params = {};
    params['to'] = null;
    params['preview'] = true;
    //this.props.setLink(params);
  }
  componentDidMount() {
    let params = Object.assign({}, this.props.params);
    params['element'] = this.myRef.current;
    //this.props.set(this.props.index, params);
    this.props.dispatch(setAdventureBuilderQuestion(this.props.index, params));
  }
  render() {
    const answers = Object.assign({}, this.props.params.answers);
    let classNames = "";
    classNames += "question";
    if(typeof(this.props.linking.from) != 'undefined' && this.props.linking.preview) {
      classNames += " linking";
    }
    if(1==1 || Object.keys(this.props.params.linkedFrom).length > 0) {
      classNames += " linked";
    }
    let startMenuItemClassNames = "";
    if(this.props.params.start == true) {
      classNames += " start";
      startMenuItemClassNames += " hidden";
    }

    return (
      <Draggable
        handle=".handle"
        defaultPosition={null}
        position={this.props.params.position}
        scale={this.props.scale}
        onDrag={(e, data) => this.props.renderVisualizations(e, data)}
        onStart={(e, data) => this.handleMoveStart(e, data)}
        onStop={(e, data) => this.handleMoveStop(e, data)}>
        <Card className={classNames}>
          <div ref={this.myRef}>
            <CardActions>
              <Grid
                justify="space-between"
                container>
                <Grid item>
                  <IconButton size="small" className="handle">
                    <DragHandle />
                  </IconButton>
                </Grid>
                <Grid item>
                  <PopupState variant="popover" popupId="card-popup-menu">
                    {popupState => (
                      <React.Fragment>
                        <IconButton size="small" {...bindTrigger(popupState)}>
                          <MoreVert />
                        </IconButton>
                        <Menu {...bindMenu(popupState)}>
                          <MenuItem className={startMenuItemClassNames} onClick={() => {
                            popupState.close();
                            this.handleSetAsStart();
                          }}>
                            <PlayForWork /> &nbsp; 
                            Set as Starting Point
                          </MenuItem>
                          <MenuItem onClick={() => {
                            popupState.close();
                            this.handleDelete();
                          }}>
                            <DeleteIcon /> &nbsp; 
                            Delete
                          </MenuItem>
                        </Menu>
                      </React.Fragment>
                    )}
                  </PopupState>
                </Grid>
              </Grid>
            </CardActions>
            <CardContent>
              <TextField
                color="primary"
                placeholder="Dialog"
                multiline
                fullWidth
                onMouseDown={(event) => this.handleClick(event)}
                onChange={(event) => this.handleTextUpdate(event)}
                onBlur={(event) => this.handleTextSubmit(event)}
                value={this.props.params.text}
              />
              <div>
                {this.renderAnswers(answers)}
                <div>
                  <Button variant="contained" color="primary" size="small" aria-label="add" onClick={() => this.handleAddAnswer()}>
                    <Add /> Add Choice
                  </Button>
                </div>
              </div>
            </CardContent>
            <div className="linkingOverlay" onClick={() => this.stopLink()} onMouseEnter={() => this.previewLink()} onMouseLeave={() => this.unpreviewLink()}>
              <LinkIcon />
            </div>
          </div>
        </Card>
      </Draggable>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  //const props = cloneDeep(state.builder.questions[ownProps.index]);
  const props = Object.assign({}, state.builder.questions[ownProps.index]);
  return props;
};

export default connect(mapStateToProps)(Question);