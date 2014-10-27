var FormValidator = function(options) {
  this.modelName = options.modelName;
  this.form = options.form;
  this.validators = options.validators;
  this.customValidators = [];
  this.messages = options.messages;
  this.validFlags = [];

  if (this.form.data('remote') || options.remote === true) {
    (function(self) {
      self.form.on('ajax:beforeSend', function(e) {
        self.validateForm(self.validators);

        var isValid = self.validFlags.indexOf(false) == -1;
        // console.log('isValid', isValid);
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
        self.validateForm(self.validators);

        var isValid = self.validFlags.indexOf(false) == -1;
        // console.log('isValid', isValid);
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

  for (var v in this.validators) {
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
    })(v, this.validators[v], this);
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
    if (element.is(':checkbox') || element.is(':radio')) {
      return element.is(':checked');
    }
    else {
      return element.val().trim() != "";
    }
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
        var elementParent = element.parents('.input'),
            label = element.siblings('label').text();

        if (element.is('select')) {
          label = element.find('option:first').text();
        }

        if (element.is(':checkbox')) {
          label = elementParent.children('label:first').text();
        }

        isValid = self.validatorCallbacks[validatorRule](element, validatorOptions);
        self.validFlags.push(isValid);

        if (!isValid) {
          message = message.replace('%{field}', label.replace('*', '')).trim();

          elementParent.addClass('field-with-error');
          elementParent.find('.error').remove();
          elementParent.append('<span class="error">' + message + '</span>');

          if ($('.field-with-error').length != 0) {
            $('#global-error-message').removeClass('hidden');
          }

          element.trigger('form_validator:fail', [ element, message ]);
        }
        else {
          elementParent.removeClass('field-with-error');
          elementParent.find('.error').remove();

          if ($('.field-with-error').length == 0) {
            $('#global-error-message').addClass('hidden');
          }

          element.trigger('form_validator:pass', [element]);
        }
      }
    })(v, validators[v], this);
  }
};

FormValidator.prototype.addCustomValidator = function(customValidator) {
  this.customValidators.push(customValidator);
};

FormValidator.prototype.validateForm = function(validators) {
  for (var v in validators) {
    (function(attribute, validatorsForAttribute, self) {
      var input = self.form.find(self.selectorFor(attribute));

      self.validateElement(input, validatorsForAttribute);
      if ( input.parents('.input').hasClass("field-with-error") ) {
        return;
      }
    })(v, validators[v], this);
  }

  for (var i = 0; i < this.customValidators.length; i++) {
    var isValid = this.customValidators[i].call(null, this.form);
    this.validFlags.push(isValid);
  }
};
