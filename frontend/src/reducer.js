import { 
  SET_VIEW_TYPE,
  TOGGLE_MAIN_MENU, 
  SET_CONFIRM_DIALOG,
  SET_QUIET_ALERT_DIALOG,
  SET_ADVENTURE_BUILDER,
  SET_ADVENTURE_BUILDER_QUESTION,
  SET_ADVENTURE_BUILDER_QUESTION_ANSWER
} from "./action";

const initialState = {
  viewType: "normal",
  menus: {
    main: false
  },
  utils: {
    confirmDialog: {
      open: false,
      title: "",
      description: "",
      confirmCallback: null
    },
    quietAlertDialog: {
      open: false,
      severity: "success",
      description: ""
    }
  },
  builder: {
    adventureId: null,
    metaDialogOpen: false,
    meta: {
      title: {
        value: "",
        error: null
      },
      description: {
        value: "",
        error: null
      }
    },
    status: {
      saved: true,
      loading: true
    },
    view: {
      x: 0,
      y: 0,
      scale: 1
    },
    questions: {},
    linking: {}
  }
};

const reducer = (state = initialState, action) => {
  let s = null;
  switch (action.type) {
    case(SET_VIEW_TYPE):
      s = Object.assign({}, state);
      s.viewType = action.toggle;
      return s;
    case(TOGGLE_MAIN_MENU):
      s = Object.assign({}, state);
      s.menus.main = action.toggle;
      return s;
    case(SET_CONFIRM_DIALOG):
      s = Object.assign({}, state);
      s.utils.confirmDialog = Object.assign(s.utils.confirmDialog, action.settings);
      return s;
    case(SET_QUIET_ALERT_DIALOG):
      s = Object.assign({}, state);
      s.utils.quietAlertDialog = Object.assign(s.utils.quietAlertDialog, action.settings);
      return s;
    case(SET_ADVENTURE_BUILDER):
      s = Object.assign({}, state);
      s.builder = Object.assign(s.builder, action.settings);
      return s;
    case(SET_ADVENTURE_BUILDER_QUESTION):
      s = Object.assign({}, state);
      if(action.params == null) {
        delete s.builder.questions[action.questionId];
      } else {
        //what if setting starting point? we need to remvoe from existing
        if(action.params.start) {
          for(let i in s.builder.questions) {
            s.builder.questions[i].start = false;
          }
        }
        s.builder.questions[action.questionId] = action.params;
      }
      return s;
    case(SET_ADVENTURE_BUILDER_QUESTION_ANSWER):
      s = Object.assign({}, state);
      if(action.params == null) {
        delete s.builder.questions[action.questionId].answers[action.answerId];
      } else {
        s.builder.questions[action.questionId].answers[action.answerId] =  action.params;
      }
      return s;
    default:
      return state;
  }
};

export default reducer