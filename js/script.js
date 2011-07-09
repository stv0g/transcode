var mapping = new Array;
var timeout = null;

$(document).ready(function(){
	$('h3').click(function() {
		$(this).next().toggle('slow');
		return false;
	});
	
	$('form').change(function() {
		compile();
	});
	
	// load default code
	loadCode('ex1.c');
	
	$('#examples select').change(function() {
		loadCode($(this).val());
	});
	
	$('.editor textarea')
		.scroll(function() {
			$(this).prev().scrollTop($(this).scrollTop());
		})
		.keypress(function() {
			updateEditor($(this));
		})
		.keyup(function () {
			if (timeout) {
				window.clearTimeout(timeout);
			}

			timeout = window.setTimeout(compile, 500);
		})
		.keydown(function(e) {
			if (e.keyCode == 9) {
				insertAtCaret(this, "\t")
				return false; // prevent default action
			}
		});
		
	$('#ansic textarea').mousemove(function(e) {
			var pres = $(this).prev().children();
			var over;
			
			pres.each(function(index, elm) {
				if (e.layerY > elm.offsetTop && e.layerY < elm.offsetTop+15) {
					over = $(elm);
					return false;
				}
			});
			
			if (over) {
				var line = over.index()+1;
				var mappedLines = mapping[line];
			
				if (mappedLines) {
					selectLines($(this), line);
					selectLines($('#assembler textarea'), mappedLines[0], mappedLines[1]);
				}
			}
		});
		
	$('#assembler textarea').scroll(function() {
		$('#byte textarea').scrollTop($(this).scrollTop());
	});
	
	$('#byte textarea').scroll(function() {
		$('#assembler textarea').scrollTop($(this).scrollTop());
	});
});

function compile() {
	var code = $('#ansic textarea').val();
		
	$.post('compile.php?' + $('form').serialize(), code, function(json) {
		updateEditor($('#assembler .editor textarea'), json.code.assembler);
		updateEditor($('#byte .editor textarea'), json.code.byte);

		if (json.messages) {
			$('#messages pre').text(json.messages);
			$('#messages').show('slow');
		}
		else {
			$('#messages').hide('slow');
		}
		
		mapping = json.mapping;
		timeout = null; // free timeout
	}, 'json');
}

function range(start, end) {
	var arr = new Array;
	for (var i = start; i <= end; i++) {
		arr.push(i);
	}
	return arr;
}

function insertAtCaret(element, text) {
	if (document.selection) {
		element.focus();
		var sel = document.selection.createRange();
		sel.text = text;
		element.focus();
	} else if (element.selectionStart || element.selectionStart === 0) {
		var startPos = element.selectionStart;
		var endPos = element.selectionEnd;
		var scrollTop = element.scrollTop;
		element.value = element.value.substring(0, startPos) + text + element.value.substring(endPos, element.value.length);
		element.focus();
		element.selectionStart = startPos + text.length;
		element.selectionEnd = startPos + text.length;
		element.scrollTop = scrollTop;
	} else {
		element.value += text;
		element.focus();
	}
}

function selectLines(editor, start, end) {
	var pres = editor.prev().children();
	pres.removeClass('activeline'); // deselect all
	
	if (end == undefined) {
		end = start;
	}

	for (var i = start; i <= end; i++) {
		pres.eq(i-1).addClass('activeline');
	}
	
	$('#assembler textarea').scrollTop(pres.get(start-1).offsetTop-50); // scroll to top of selection
}

function updateEditor(editor, value) {
	if (value) {
		editor.val(value);
	}
	
	var overlay = editor.prev();
	var lines = editor.val().split("\n").length;
	
	overlay.empty();
	for (var i = 0; i < lines; i++) {
		overlay.append($('<pre>').text(i+1));
	}
}

function loadCode(file) {
	$.get(file, function(data) {
		updateEditor($('#ansic textarea'), data);
		compile();
	});
}
