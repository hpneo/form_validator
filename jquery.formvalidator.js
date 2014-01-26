$.fn.formValidator = function(options) {
  return this.each(function(index, form) {
    var formValidator = new FormValidator({
      modelName: options.modelName,
      form: $(form),
      validators: options.validators,
      messages: options.messages
    });
  });
};