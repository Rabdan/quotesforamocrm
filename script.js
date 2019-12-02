define(['jquery'], function($){
  var aisa_CustomWidget = function () {
    var self = this;
    this.aisaautoquot = function(e){
      if(!e)e=window.event;
      var el = this;
      var k = e.key;
      if (e.keyCode == 34) {
        if('number'==typeof el.selectionStart){
          var v = el.value;
          var sel1 = el.selectionStart;
          var prevstr = el.value.substr(0,el.selectionStart);
          if(k == '"') {
            k = '«';
            for(var i=prevstr.length; i>=0; i--){
              if(prevstr.substr(i,1) == '«') {
                k = "»";
                break;
              }
              if(prevstr.substr(i,1) == '»') {
                k = "«";
                break;
              }
            }
          }
          el.value = prevstr + k + el.value.substr(el.selectionEnd);
          el.selectionStart=el.selectionEnd=sel1+k.length;
        } else {
          // выделение в IE не работает, так что просто добавляем в конец
          var prevstr = el.value;
          if(k == '"') {
            k = '«';
            for(var i=prevstr.length; i>=0; i--){
              if(prevstr.substr(i,1) == '«') {
                k = "»";
                break;
              }
              if(prevstr.substr(i,1) == '»') {
                k = "«";
                break;
              }
            }
          }
          el.value += k;
        }
        if(e.preventDefault)e.preventDefault();
        if(e.stopPropagation)e.stopPropagation();
        e.cancelBubble = true;
        return false;
      }
      return true;
    };
    this.aisaautoquote_str = function(oldstr) {
      var retstr = '';
      var flg = false;
      var ch = '';
      for(var i=0; i<oldstr.length; i++) {
        ch = oldstr.substr(i,1);
        if(ch == '"' || ch == '»' || ch == '«') {
          if(flg) {
            ch = '»';
            flg = false;
          } else {
            ch = '«';
            flg = true;
          }
        }
        retstr = retstr + ch;
      }
      return retstr;
    }
    this.callbacks = {
      render: function(){
        return true;
      },
      init: function(){
        $('head').append('<link rel="stylesheet" type="text/css" href="' + self.get_settings().path + '/aisa_autoquote.css?v=0.1.0"/>');
        return true;
      },
      bind_actions: function(){
        $('textarea[name*="NAME"]').keypress(self.aisaautoquot);
        $('textarea[name*="NAME"]').change(function() {
          var str = self.aisaautoquote_str(this.value);
          this.value = str;
        });
        $('input[name*="NAME"]').keypress(self.aisaautoquot);
        $('input[name*="NAME"]').change(function() {
          var str = self.aisaautoquote_str(this.value);
          this.value = str;
        });
        $('input[name="name"]').keypress(self.aisaautoquot);
        $('input[name="name"]').change(function() {
          var str = self.aisaautoquote_str(this.value);
          this.value = str;
        });
        $('input[name="linked"]').keypress(self.aisaautoquot)
        $('input[name="linked"]').change(function() {
          var str = self.aisaautoquote_str(this.value);
          this.value = str;
        });
        return true;
      },
      settings: function(){
        var conf_input = $('input[name="setblock"]');
        conf_input.attr('type', 'checkbox');
        conf_input.attr('id', 'setblock-confirmation');
        conf_input.parent().append('<label for="setblock-confirmation" style="padding-left: 5px;">Подтверждаю своё согласие на передачу данных ( имя пользователя, e-mail) на сервер компании «А есть А»</label><br><br><div class="aisa_error_install" style="color:red;"></div>');
        conf_input.parents('.widget_settings_block__item_field').show();

        if(conf_input.val() == '1') conf_input.prop('checked', true);
        conf_input.on('click', function() {
          if(conf_input.is(':checked')) {
            conf_input.val('1');
          } else {
            conf_input.val('');
          }
        });
        return true;
      },
      onSave: function(){
        if( $('#widget_active__sw').prop("checked") ) {
          var isAgree = document.getElementById('setblock-confirmation').checked;
          if (!isAgree) {
            $('.aisa_error_install').text('Что бы подключить виджет необходимо согласиться с передачей данных на сервер!');
            $('.aisa_error_install').fadeIn();
            $('#save_' + self.get_settings().widget_code).removeAttr('data-loading');
            $('#save_' + self.get_settings().widget_code + ' .button-input-inner').removeAttr('style');
            $('#save_' + self.get_settings().widget_code + ' .button-input__spinner').remove();
            return false;
          }
          $.get( 'https://api.aisapr.ru/amocrm/index.php',
            {
              name: self.get_settings().name,
              email: self.get_settings().email
            }, function(response) {
              var isValid = true;
              $('#save_' + self.get_settings().widget_code).removeAttr('data-loading');
              $('#save_' + self.get_settings().widget_code + ' .button-input-inner').removeAttr('style');
              $('#save_' + self.get_settings().widget_code + ' .button-input__spinner').remove();
              if (response == 'FAIL') {
                $('.aisa_error_install').text('Ошибка при регистрации, обратитесь к разработчикам!');
                $('.aisa_error_install').fadeIn();
                isValid = false;
                self.set_status('error');
              } else {
                self.set_status('installed');
              }
              return isValid;
          }).fail( function() {
            $('.aisa_error_install').text('Ошибка при регистрации, обратитесь к разработчикам!');
            $('.aisa_error_install').fadeIn();
            $('#save_' + self.get_settings().widget_code).removeAttr('data-loading');
            $('#save_' + self.get_settings().widget_code + ' .button-input-inner').removeAttr('style');
            $('#save_' + self.get_settings().widget_code + ' .button-input__spinner').remove();
            self.set_status('error');
            return false;
          });
        }
        return true;
      },
      destroy: function(){

      },
      contacts: {
        //select contacts in list and clicked on widget name
        selected: function(){
          if (self.list_selected().selected.length) {
            self.widgetsOverlay(true);
            var c_data = self.list_selected().selected;
            var length = c_data.length;
            var reloadfl = false;
            var contactid = [];
            var companyid = [];
            var countdfd = 0;
            var lastRequestAt = new Date;
            for (var x = 0; x < length; x++) {
              if(c_data[x].type == 'contact') {
                contactid.push(c_data[x].id);
              }
              if(c_data[x].type == 'company') {
                companyid.push(c_data[x].id);
              }
            }
            var getAjax = function( url, listid ) {
              var dfd  = new $.Deferred();
              if(listid.length > 0) {
                  return $.get(url, {
                      'USER_LOGIN': AMOCRM.widgets.system.amouser,
                      'USER_HASH': AMOCRM.widgets.system.amohash,
                      'id': listid
                    });
              } else {
                return dfd.resolve({});
              };
            }
            var postAjax = function(url, listr) {
              var dfd;
              dfd = new $.Deferred();
              if( "request" in listr ) {
                return $.ajax({
                      url: url,
                      type: "POST",
                      headers: { 'USER_LOGIN': AMOCRM.widgets.system.amouser,
                                'USER_HASH': AMOCRM.widgets.system.amohash
                              },
                      data: listr,
                      dataType: 'json'
                    });
              } else {
                return dfd.resolve({});
              };
            }
            var syncAjax = function( type, url, listid ) {
              var timeFromLastRequest = new Date - lastRequestAt;
              countdfd = countdfd + 1;
              var delay = countdfd * 1000;
              delay += timeFromLastRequest + countdfd * 10;
              var d = new $.Deferred();
                  setTimeout(function() {
                    if(countdfd > 0 ) { countdfd = countdfd - 1; }
                    if(type == 'GET') {
                      var pd = getAjax(url, listid).done( function(data){
                        d.resolve(data);
                      });
                    } else {
                      var pd = postAjax(url, listid).done( function(data){
                        d.resolve(data);
                      });
                    }
                  }, delay);
              return d.promise();
            }

        $.when( syncAjax('GET', '/private/api/v2/json/contacts/list', contactid),
                  syncAjax('GET', '/private/api/v2/json/company/list', companyid)
        ).then(function( fromContact, fromCompany ) {
          var lf_company_name = '';
          var new_company_name ='';
          var lf_name = '';
          var new_name ='';
          var lf_linked_company_id = '';
          var updatearr = [];
          var tsrupd = '';
          var contactresp = {};
          var companyresp = {};
          if($.isEmptyObject(fromContact) == false && fromContact.response.contacts.length != undefined) {
            for (var x = 0; x < fromContact.response.contacts.length; x++) {
              lf_company_name = fromContact.response.contacts[x].company_name;
              new_company_name ='';
              lf_name = fromContact.response.contacts[x].name;
              new_name ='';
              lf_linked_company_id = fromContact.response.contacts[x].linked_company_id;
              new_company_name = self.aisaautoquote_str(lf_company_name);
              new_name = self.aisaautoquote_str(lf_name);
              if( new_name != lf_name || new_company_name != lf_company_name ) {
                tsrupd = {
                  "id": fromContact.response.contacts[x].id,
                  "name": new_name,
                  "company_name": new_company_name,
                  "last_modified": Date.now()
                }
                updatearr.push(tsrupd);
              }
            }
            if(updatearr.length > 0) {
              contactresp = { "request":
              { "contacts": {
                "update":  updatearr
              }}};
            }
          }
          //company
          if($.isEmptyObject(fromCompany) == false && fromCompany.response.contacts.length != undefined) {
            updatearr = [];
            tsrupd = '';
            for (var x = 0; x < fromCompany.response.contacts.length; x++) {
              lf_name = fromCompany.response.contacts[x].name;
              new_name ='';
              new_name = self.aisaautoquote_str(lf_name);
              if( new_name != lf_name ) {
                tsrupd = {
                  "id": fromCompany.response.contacts[x].id,
                  "name": new_name,
                  "last_modified": Date.now()
                }
                updatearr.push(tsrupd);
              }
            }
            if(updatearr.length > 0) {
              companyresp = { "request":
              { "contacts": {
                "update":  updatearr
              }}};
            }
          }
          //posts
          return $.when( syncAjax('POST', '/private/api/v2/json/contacts/set', contactresp), syncAjax('POST', '/private/api/v2/json/company/set', companyresp) );
        }).then(function( fromContact, fromCompany ){
          var tid = 0;
        if($.isEmptyObject(fromContact) == false && fromContact.response.contacts.update.length != undefined) {
            for (var x = 0; x < fromContact.response.contacts.update.length; x++) {
              tid = fromContact.response.contacts.update[x].id;
              if(tid) {
                var lelem = $('div[data-id='+tid+']').find('a.js-navigate-link');
                var text = self.aisaautoquote_str(lelem.text());
                lelem.text(text);
                lelem.attr('title',text);
                lelem.css('color','palevioletred');
              }
            }
          }
          if($.isEmptyObject(fromCompany) == false && fromCompany.response.contacts.update.length != undefined) {
            for (var x = 0; x < fromCompany.response.contacts.update.length; x++) {
              tid = fromCompany.response.contacts.update[x].id;
              if(tid) {
                var lelem = $('div[data-id='+tid+']').find('a.js-navigate-link');
                var text = self.aisaautoquote_str(lelem.text());
                lelem.text(text);
                lelem.attr('title',text);
                lelem.css('color','palevioletred');
              }
            }
          }
          self.widgetsOverlay(false);
          AMOCRM.notifications.add_error({
            header: 'Сообщение',
            text: 'Замена кавычек прошла успешно',
            date: Math.ceil(Date.now() / 1000)
          });
//          location.reload();
        }).fail(function() {
          self.widgetsOverlay(false);
          AMOCRM.notifications.add_error({
            header: 'Ошибка',
            text: 'Что-то пошло не так',
            date: Math.ceil(Date.now() / 1000)
          });
        });
      }
    }
  },
  leads: {
    //select leads in list and clicked on widget name
    selected: function(){
    }
  },
  tasks: {
    //select taks in list and clicked on widget name
    selected: function(){
    }
  }
};
return this;
};

return aisa_CustomWidget;
});
