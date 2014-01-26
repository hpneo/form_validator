var FormValidator = function(options) {
  this.modelName = options.modelName;
  this.form = options.form;
  this.validators = options.validators;
  this.messages = options.messages;
  this.validFlags = [];

  if (this.form.data('remote') || options.remote === true) {
    (function(self) {
      self.form.on('ajax:beforeSend', function(e) {
        self.validateForm(validators);

        var isValid = self.validFlags.indexOf(false) == -1;
        self.validFlags = [];

        if (isValid) {
          self.form.trigger('form_validator:pass');
        }
        else {
          self.form.trigger('form_validator:fail');
        }

        return isValid;
      });
    })(this);
  }
  else {
    (function(self) {
      self.form.on('submit', function(e) {
        self.validateForm(validators);

        var isValid = self.validFlags.indexOf(false) == -1;
        self.validFlags = [];

        if (isValid) {
          self.form.trigger('form_validator:pass');
        }
        else {
          self.form.trigger('form_validator:fail');
        }

        if (!isValid) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      });
    })(this);
  }

  for (var v in validators) {
    (function(attribute, validatorsForAttribute, self) {
      var input = self.form.find(self.selectorFor(attribute)),
          validateEvent = 'blur';

      if (input.is(':checkbox') || input.is(':radio')) {
        validateEvent = 'change';
      }

      input.on(validateEvent, function() {
        self.validateElement($(this), validatorsForAttribute);

        self.validFlags = [];
      });
    })(v, validators[v], this);
  }
};

FormValidator.prototype.selectorFor = function(attribute) {
  return '[name="' + this.modelName + '[' + attribute + ']"]';
};

FormValidator.prototype.validatorCallbacks = {
  acceptance: function(element, validator_options) {
    return element.is(':checked');
  },
  presence: function(element) {
    return element.val().trim() != "";
  },
  format: function(element, validator_options) {
    return validator_options['with'].test(element.val());
  },
  length: function(element, validator_options) {
    var current = element.val();

    if (validator_options['is']) {
      return current.length == validator_options['is'];
    }
    else {
      return current.length >= validator_options.minimum && current.length <= validator_options.maximum;
    }
  }
};

FormValidator.prototype.validateElement = function(element, validators) {
  var isValid = true;

  for (v in validators) {
    (function(validatorRule, validatorOptions, self) {
      var message = validatorOptions['message'] || self.messages[validatorRule];

      if (element.length > 0 && validatorRule in self.validatorCallbacks) {
        var elementParent = element.parents('.input');

        isValid = self.validatorCallbacks[validatorRule](element, validatorOptions);
        self.validFlags.push(isValid);

        if (!isValid) {
          elementParent.addClass('field-with-error');
          elementParent.find('.error').remove();
          elementParent.append('<span class="error">' + message + '</span>');

          if ($('.field-with-error').length != 0) {
            $('#global-error-message').removeClass('hidden');
          }

          element.trigger('form_validator:fail');
        }
        else {
          elementParent.removeClass('field-with-error');
          elementParent.find('.error').remove();

          if ($('.field-with-error').length == 0) {
            $('#global-error-message').addClass('hidden');
          }

          element.trigger('form_validator:pass');
        }
      }
    })(v, validators[v], this);
  }
};

FormValidator.prototype.validateForm = function(validators) {
  for (var v in validators) {
    (function(attribute, validatorsForAttribute, self) {
      var input = self.form.find(self.selectorFor(attribute));

      self.validateElement(input, validatorsForAttribute);
    })(v, validators[v], this);
  }
};