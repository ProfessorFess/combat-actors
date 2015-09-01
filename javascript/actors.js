$(function(){

  var ActorList = Backbone.Collection.extend({

    model: Actor,

    localStorage: new Backbone.LocalStorage("actors-backbone"),

    comparator: function(x){
      return - parseInt(x.get('order'));
    },

    setActive: function(actor){
      this.where({active: true}).forEach(function(previous) {
        previous.save({active: false});
      });
      actor.save({active: true});
      this.setSelected(actor);
    },

    setSelected: function(actor){
    if (actor != undefined) {
    this.where({selected: true}).forEach(function(previous) {
        previous.save({selected: false});
      });
      actor.save({selected: true});
      }
    },

    activeActor: function(){
      return this.where({active: true})[0];
    },

    nextActor: function(){
      candidate_index = this.nextActiveIndex();
      target_index = candidate_index == this.length ? 0 : candidate_index;
      return this.at(target_index);
    },

    activeIndex: function(){
      return this.indexOf(this.activeActor());
    },

    selectedActor: function(){
      return this.where({selected: true})[0];
    },

    selectedIndex: function() {
      return this.indexOf(this.selectedActor()) || 0
    },

    nextActiveIndex: function() {
      return this.activeIndex() + 1
    },

    nextSelectedIndex: function() {
      return this.selectedIndex() + 1
    },

    downSelect: function() {
      candidate_index = this.nextSelectedIndex();
      target_index = candidate_index == this.length ? 0 : candidate_index;
      this.setSelected(this.at(target_index));
    },

    upSelect: function() {
      candidate_index  = this.selectedIndex() - 1;
      target_index = candidate_index < 0 ? this.length - 1 : candidate_index;
      this.setSelected(this.at(target_index));
    },

    activateNext: function() {
      candidate_index = this.nextActiveIndex();
      target_index = candidate_index == this.length ? 0 : candidate_index;
      this.setActive(this.at(target_index));
    },

    activatePrevious: function() {
      candidate_index  = this.activeIndex() - 1;
      target_index = candidate_index < 0 ? this.length - 1 : candidate_index;
      this.setActive(this.at(target_index));
    },

    isFocusedAway: function() {
      return (this.selectedActor() != this.activeActor())
    }

  });

  var Environment = new ActorEnvironment({id: 1});
  var Actors = new ActorList;

  // make available in console for testing
  actors = Actors;
  env    = Environment;

  var MarqueeView = Backbone.View.extend({
    tagName:   "div",

    attributes:  {
      'class' : 'cell'
    },

    template: _.template($('#marquee-template').html()),

    events: {
      "dblclick .actor-initiative" : "editInitiative",
      "keypress .actor-initiative input" : "updateInitiative",
      "blur .actor-initiative input"     : "hideInitiative",
      "click a.remove"   : "removeCondition",
      "keypress .input"  : "addConditionOnEnter",
      "click .labels"    : "setConditionFocus",
      "dblclick label"   : "editName",
      "keypress .edit"   : "updateOnEnter",
      "blur .edit"       : "close",
    },

    initialize: function() {
      this.listenTo(this.collection, 'change', this.render);
    },

    editInitiative: function() {
      this.showInitiative.hide();
      this.initiativeForm.show();
      this.$('.actor-initiative .edit-form input').focus();
      this.$('.actor-initiative .edit-form input').val("");
    },

    updateInitiative: function(e) {
      if (e.keyCode == 13) {
        var value = this.$('.actor-initiative .edit-form input').val() || 0;
        this.collection.selectedActor().save({order: parseInt(value)});
        this.hideInitiative();
      }
    },

    hideInitiative: function() {
      this.showInitiative.show();
      this.initiativeForm.hide();
    },

    setConditionFocus: function(e) {
      this.newConditionCell.show();
      this.newCondition.val(null);
      this.newCondition.focus();
    },

    addConditionOnEnter: function(e) {
      if (e.keyCode == 13) {
        var target_id = $(e.target).parent().attr('id');
        var condition = this.newCondition.val().replace(/^\s+|\s+$/g,'');
        this.collection.selectedActor().addCondition(condition);
        this.newCondition.blur();
        this.newConditionCell.hide();
      }
    },

    removeCondition: function(e) {
      var target_id = $(e.target).parent().attr('id');
      var condition = target_id.replace(/-/g , " ");
      this.collection.selectedActor().removeCondition(condition);
      return false;
    },

    editName: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },

    close: function() {
      var value = this.input.val();
      if (!value) {
        this.clear();
      } else {
        this.$el.removeClass("editing");
        this.collection.selectedActor().save({title: value});
        this.render();
      }
    },

    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    render: function() {
      var selectedActor = this.collection.selectedActor();
      if (selectedActor) {
        this.$el.html(this.template(selectedActor.toJSON()));
        this.initiativeForm = this.$('.actor-initiative .edit-form');
        this.showInitiative = this.$('.actor-initiative .show');
        this.newCondition = this.$('.editable .editor');
        this.newConditionCell = this.$('.input.label');

        this.input = this.$('.edit');
        if (this.collection.isFocusedAway()) {
          this.away();
        } else { this.notAway(); }
      }
      return this;
    },

    away: function() {
      this.$el.parent().addClass("away");
      this.$('.return-msg').show();
    },

    notAway: function() {
      this.$el.parent().removeClass("away");
      this.$('.return-msg').hide();
    },
  });

  var MarqueeNextView = Backbone.View.extend({
    tagName:   "div",

    attributes:  {
      'class' : 'cell'
    },

    template: _.template($('#marquee-next-template').html()),

    initialize: function() {
      this.listenTo(this.collection, 'change', this.render);
    },

    render: function() {
      var nextActor = this.collection.nextActor();
      if (nextActor) {
        this.$el.html(this.template(nextActor.toJSON()));
        if (this.collection.isFocusedAway()) {
          this.away();
        } else { this.notAway(); }
      }
      return this;
    },

    away: function() {
      this.$el.parent().hide();
    },

    notAway: function() {
      this.$el.parent().show();
    },

  });

  var EnvironmentView = Backbone.View.extend({
    tagName: "div",
    attributes: { 'class' : 'environment' },
    template: _.template($('#environment-list').html()),

    events: {
      "click a.remove"   : "removeAspect",
      "keypress .input"  : "addAspectOnEnter",
      "click .labels"    : "setAspectFocus"
    },

    initialize: function() {
      this.listenTo( Environment, 'change', this.render);
      window.ev = this;
    },

    render: function() {
      this.$el.html(this.template(Environment.toJSON()));
      this.newAspect = this.$('.editable .editor');
      this.newAspectCell = this.$('.input.label');
      return this;
    },

    addAspectOnEnter: function(e) {
      if (e.keyCode == 13) {
        var aspect = this.newAspect.val().replace(/^\s+|\s+$/g,'');
        Environment.addAspect(aspect);
        this.newAspect.blur();
        this.newAspectCell.hide();
      }
    },

    removeAspect: function(e) {
      var target_id = $(e.target).parent().attr('id');
      var aspect    = target_id.replace(/__/g , " ");
      Environment.removeAspect(aspect);
      return false;
    },

    setAspectFocus: function(e) {
      this.newAspectCell.show();
      this.newAspect.val(null);
      this.newAspect.focus();
    }
  });

  var ActorView = Backbone.View.extend({

    tagName:  "li",

    attributes : {
      'class' : 'actor-item'
    },

    template: _.template($('#item-template').html()),

    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('persistent', _.include(this.model.get('features'), 'persistent'));
      this.$el.toggleClass('active', this.model.get('active'));
      this.$el.toggleClass('selected', this.model.get('selected'));
      return this;
    }
  });

  var AppView = Backbone.View.extend({

    el: $("#actorapp"),

    events: {
      "keypress #new-actor":       "createOnEnter",
      "keypress #new-actor-init":  "createOnEnter"
    },

    initialize: function() {

      this.actorInput      = this.$("#new-actor");
      this.actorOrderInput = this.$("#new-actor-init");
      this.envView = new EnvironmentView({ model: Environment });
      $('#environment-placement').append(this.envView.render().el);

      this.listenTo(Actors, 'add', this.addAll);
      this.listenTo(Actors, 'reset', this.addAll);
      this.listenTo(Actors, 'change:order', this.forceSort);
      this.listenTo(Actors, 'sort', this.reset);
      this.listenTo(Actors, 'change', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');
      this.orderList = $("#actor-list");

      window.v = this;
      _.bindAll(this, 'commandStroke');
      $(document).bind('keypress', this.commandStroke);

      Actors.fetch();
      Environment.fetch();

      this.selectCurrent(Actors.activeActor());
    },

    commandStroke: function(e) {
      if (!$(e.target).is('input, textarea')) {
        switch (e.keyCode) {
          case 122:  // 'z'
            this.removeFirstConditionFromActor(Actors.selectedActor()); break;
          case 120:  // 'x'
            this.removeLastConditionFromActor(Actors.selectedActor()); break;
          case 114:  // 'r'
            this.rotateConditions(Actors.selectedActor()); break;
          case 112:  // 'p'
            Actors.activatePrevious(); break;
          case 110:  // 'n'
          case 13:   // Enter
            if (Actors.isFocusedAway()) {
              this.selectCurrent(Actors.activeActor()); break;
            } else {
              Actors.activateNext(); break;
            }
          case 106:  // 'j'
            Actors.downSelect(); break;
          case 107:  // 'k'
            Actors.upSelect(); break;
          case 101:  // 'e'
            this.addEnvironmentAspect(e); break;
          case 99:  // 'c'
            this.selectCurrent(Actors.activeActor()); break;
          case 105:  // 'i'
          case 97:  // 'a'
            this.addCondition(Actors.selectedActor(), e); break;
          case 88:  // 'X'
            this.removeConditionsFromActor(Actors.selectedActor()); break;
          case 82:  // 'R'
            this.resetEverything(); break;
          case 78:  // 'N'
            this.editActorName(Actors.selectedActor(), e); break;
          case 73:  // 'I'
            this.editInitiative(Actors.selectedActor(), e); break;
          case 68:  // 'D'
            this.deleteActor(Actors.selectedActor()); break;
          case 65:  // 'A'
            this.addActor(e); break;
          case 63:
            $.colorbox({inline:true,href:'#help'}); break;
          case 62:  // '>'
            this.actorDown(); break;
          case 61: // '='
            this.selectNextAndEditInitiative(e); break;
          case 60:  // '<'
            this.actorUp(); break;
          case 57:  // '9'
            this.rotateFeature(Actors.selectedActor(), ['bloodied', 'dying', 'incapacitated', 'health-neutral']); break;
          case 51:  // '3'
            this.rotateFeature(Actors.selectedActor(), ['defending', 'granting', 'defense-neutral']); break;
          case 50:  // '2'
            this.rotateFeature(Actors.selectedActor(), ['advantage', 'disadvantage', 'advantage-neutral']); break;
          case 49:  // '1'
            this.toggleReadied(Actors.selectedActor()); break;
          case 48:  // '0'
            this.toggleFeature(Actors.selectedActor(), 'persistent'); break;
          case 45:  // '-'
            this.incrementLastConditionFromActor(Actors.selectedActor(), -1); break;
          case 43:  // '+'
            this.incrementLastConditionFromActor(Actors.selectedActor(), +1); break;
          case 710: // 'Shift-Option-I'
            this.resetAllInitiatives(e); break;
          default:
            console.log('Command key: ' + e.keyCode);
          }
       }
    },

    reset: function(){
      this.addAll();
    },

    render: function() {
      this.main.show();
      this.footer.show();
      if (Actors.isFocusedAway()) {
          this.away();
        } else { this.notAway(); }
      return this;
    },

    away: function() {
      this.$el.addClass("away");
    },

    notAway: function() {
      this.$el.removeClass("away");
    },

    forceSort: function(actor) {
      Actors.sort();
    },

    addOne: function(actor) {
      var view = new ActorView({model: actor});
      actor.view = view;
      this.orderList.append(view.render().el);
    },

    addAll: function() {
      this.orderList.empty();
      Actors.each(this.addOne, this);
    },

    actorUp: function() {
      current_index = Actors.selectedIndex();
      candidate_index  = current_index - 1;
      target_index = candidate_index < 0 ? 0 : candidate_index;
      if (target_index != current_index) {
        target_initiative = parseInt(Actors.at(target_index).get('order')) + 1;
        Actors.at(current_index).save({'order': target_initiative});
      }
    },

    actorDown: function() {
      current_index = Actors.selectedIndex();
      candidate_index  = current_index + 1;
      target_index = candidate_index == Actors.length ? Actors.length - 1 : candidate_index;
      if (target_index != current_index) {
        candidate_initiative = parseInt(Actors.at(target_index).get('order')) - 1;
        target_initiative = candidate_initiative < 0 ? 0 : candidate_initiative;
        Actors.at(current_index).save({'order': target_initiative});
      }
    },

    selectCurrent: function(model) {
      if (model) { Actors.setSelected(model); }
    },

    renderCurrent: function(model) {
      actor = Actors.activeActor();
      if (actor) { Actors.setActive(actor); }
    },

    renderSelected: function(model) {
      actor = Actors.selectedActor();
      if (actor) { Actors.setSelected(actor); }
    },

    activateNext: function() {
      Actors.activateNext();
    },

    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.actorInput.val()) return;

      var newModel = Actors.create({
        title: this.actorInput.val(),
        order: this.actorOrderInput.val()
      });

      Actors.setSelected(newModel);
      this.actorInput.val('');
      this.actorOrderInput.val('');
      this.exitTextFocus();
      $('#actor-form').hide();
    },

    editActorName: function(model, e) {
      this.marquee.editName();
      e.preventDefault();
    },

    editInitiative: function(model, e) {
      this.marquee.editInitiative();
      e.preventDefault();
    },

    addCondition: function(model, e) {
      this.marquee.setConditionFocus();
      e.preventDefault();
    },

    addEnvironmentAspect: function(e) {
      this.envView.setAspectFocus();
      e.preventDefault();
    },

    addActor: function(e) {
      $('#actor-form').show();
      this.actorInput.focus();
      e.preventDefault();
    },

    rotateConditions: function(model) {
      model.rotateConditions();
      // why isn't the save firing a change, triggering render?
      this.marquee.render();
      this.render();
    },

    toggleFeature: function(model, feature) {
      model.toggleFeature(feature);
    },

    rotateFeature: function(model, featureList) {
      model.rotateFeature(featureList);
    },

    toggleReadied: function( model ) {
      model.toggleFeature('readied' );
      var readyString = model.get('title') + " ready"
      if (model.hasFeature('readied')) {
        Environment.addAspect(readyString);
      } else {
        Environment.removeAspect(readyString);
      }
    },

    removeFirstConditionFromActor: function(actor, e) {
      target = _.first(actor.get('conditions'));
      actor.removeCondition(target);
    },

    removeLastConditionFromActor: function(actor, e) {
      target = _.last(actor.get('conditions'));
      actor.removeCondition(target);
    },

    incrementLastConditionFromActor: function(actor, offset, e) {
      target = _.last(actor.get('conditions'));
      actor.incrementCondition(target, offset);
    },

    removeConditionsFromActor: function(actor) {
      actor.removeAllConditions();
    },

    removeAllActorConditions: function() {
      Actors.each(this.removeConditionsFromActor, this);
    },

    resetActorFeatures: function(actor) {
      actor.removeFeature("bloodied");
      actor.removeFeature("dying");
      actor.removeFeature("readied");
    },

    resetAllActorFeatures: function() {
      Actors.each(this.resetActorFeatures, this);
    },

    resetEverything: function() {
      var reset = window.confirm("Reset the list?  This will remove non-permanent actors and all actor conditions.");
      if (reset) {
        this.deleteActorsWithoutFeature('persistent');
        this.removeAllActorConditions();
        this.resetAllActorFeatures();
        this.resetAllInitiatives();
        Environment.resetAllAspects();
      } else { return }
    },

    resetAllInitiatives: function(e) {
      Actors.each(function(actor) { actor.save({order: ''}); }, this);
    },

    selectNextActorWithoutInitiative: function() {
      var target = _.find(  Actors.models, function(actor) {
       return actor.hasNoInitiative();
      });
      Actors.setSelected( target );
    },

    selectNextAndEditInitiative: function(e) {
      this.selectNextActorWithoutInitiative();
      if (Actors.selectedActor().hasNoInitiative()) {
        this.editInitiative(Actors.selectedActor(), e);
      };
    },

    deleteActorsWithoutFeature: function( filterFeature ) {
      var notFeatured = function(a) {
        return !a.hasFeature(filterFeature);
      }
      var deleteTargets = Actors.filter(notFeatured, this);
      _.each(deleteTargets, this.deleteActor, this);
    },

    deleteActor: function(target) {
      Actors.downSelect();
      if (target.get('active')) {
        Actors.activateNext();
      }
      target.destroy();
    },

    exitTextFocus: function() {
      this.actorInput.blur();
      this.actorOrderInput.blur();
    }

  });

  var App = new AppView;
  var Marquee = new MarqueeView({collection: Actors});
  $('.marquee.primary').append(Marquee.render().el);

  var MarqueeNext = new MarqueeNextView({collection: Actors});
  $('.marquee.next').append(MarqueeNext.render().el);

  App.marquee = Marquee

  // console debugging
  window.Marquee = Marquee
});
