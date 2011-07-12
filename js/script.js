var mapping = new Array;
var timeout = null;

$(document).ready(function(){
	// load default code
	loadCode($('#examples option:selected').val());

	// bind events
	$('.popup h3').click(function() {
		$(this).next().toggle('slow');
		return false;
	});
	
	$('form').change(function() {
		compile();
	});
	
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
		var hover = getHoverLine($(this), e);
		if (hover) {
			var line = hover.index()+1;
			
			if (mapping.ansic[line]) {
				var start = mapping.ansic[line][0];
				var end = mapping.ansic[line][1];
		
				selectLines($(this), false, line);
				selectLines($('#assembler textarea'), true, start, end);
				selectLines($('#byte textarea'), true, mapping.assembler[start], mapping.assembler[end]);
			}
		}
	});
		
	$('#assembler textarea').mousemove(function(e) {
		var hover = getHoverLine($(this), e);
		if (hover) {
			var line = hover.index()+1;

			if (mapping.assembler[line]) {
				var mappedLine = mapping.assembler[line];
				selectLines($(this), false, line);
				selectLines($('#byte textarea'), true, mappedLine);
			}
		}
	});
	
	$('#byte textarea').mousemove(function(e) {
		var hover = getHoverLine($(this), e);
		if (hover) {
			var line = hover.index()+1;

			if (mapping.byte[line]) {
				var mappedLine = mapping.byte[line];
				selectLines($(this), false, line);
				selectLines($('#assembler textarea'), true, mappedLine);
			}
		}
	});
});

function compile() {
	var code = $('#ansic textarea').val();
		
	$.post('compile.php?' + $('form').serialize(), code, function(json) {
		updateEditor($('#assembler .editor textarea'), json.code.assembler);
		updateEditor($('#byte .editor textarea'), json.code.byte);
		renderStats(json.stats);

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

function selectLines(editor, scroll, start, end) {
	var pres = editor.prev().children();
	pres.removeClass('activeline'); // deselect all
	
	if (end == undefined) {
		end = start;
	}

	for (var i = start; i <= end; i++) {
		pres.eq(i-1).addClass('activeline');
	}
	
	var offset = pres.get(start-1).offsetTop;
	if (scroll) {
		editor.scrollTop(offset-50); // scroll to top of selection
	}
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
	$.get('examples/' + file, function(data) {
		updateEditor($('#ansic textarea'), data);
		compile();
	});
}

function getHoverLine(editor, e) {
	var pres = editor.prev().children();
	var hover = undefined;
		
	pres.each(function(index, elm) {
		if (e.layerY > elm.offsetTop && e.layerY < elm.offsetTop+15) {
			hover = $(elm);
			return false;
		}
	});
	
	return hover;
}

function renderStats(stats) {
	var table = $('<table>');
	var max;
	
	for (var mnemonic in stats) {
		var count = stats[mnemonic];
	
		if (!max) max = count;
	
		table.append(
			$('<tr>').append($('<td>').text(mnemonic))
				.append(
					$('<td>').append(
						$('<div>').text(count).width(800*count/max).addClass('bar')
					)
				)
		);
	}
	
	$('#stats div').empty().append(table);
}
