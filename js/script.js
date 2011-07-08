var editors = {};
var mapping = new Array;

jQuery(document).ready(function(){
	$('#options h3').click(function() {
		$(this).next().toggle('slow');
		return false;
	}).next().hide();
	
	$('form[name=options] :input').change(function() {
		compile(editors['ansic']);
	});
	
	editors['ansic'] = CodeMirror(document.getElementById('ansic'), {
		indentWithTabs: true,
		lineNumbers: true,
		onChange: compile,
		onCursorActivity: function(editor) {
			var line = editor.getCursor().line;
			var mappedLine = mapping[line+1]-1;
			
			var p = line+2;
			while(!mapping[p] && p <= editor.lineCount()) p++;
			
			var mappingEnd = mapping[p]-2;
			
			if (mappedLine) {
				editors['assembler'].setCursor(mappedLine);
				highlightLines(editor, line);
				highlightLines(editors['assembler'], range(mappedLine, mappingEnd));
			}
		}
	});
	
	editors['assembler'] = CodeMirror(document.getElementById('assembler'), {
		indentWithTabs: true,
		lineNumbers: true,
		readOnly: true,
		onCursorActivity: function(editor) {
			highlightLines(editor, editor.getCursor().line);
		}
	});
	
	editors['byte'] = CodeMirror(document.getElementById('byte'), {
		indentWithTabs: true,
		lineNumbers: true,
		readOnly: true,
		onCursorActivity: function(editor) {
			highlightLines(editor, editor.getCursor().line);
		}
	});
	
	// load default code
	$.get('main.c', function(data) {
		editors['ansic'].setValue(data);
	});
});

function highlightLines(editor, lines) {
	if (!$.isArray(lines)) {
		lines = [lines];
	}

	if (editor.hlLines) {
		$.each(editor.hlLines, function(index, value) {
			editor.setLineClass(value, null);
		});
	}
	
	$.each(lines, function(index, value) {
		editor.setLineClass(value, 'activeline');
	});
	
	editor.hlLines = lines;
}

function compile(editor) {
	var code = editor.getValue();
	var options = {
		olevel: $('input[name=olevel]').val(),
		mmcu: $('select[name=mmcu] option:selected').val(),
		comments: $('input[name=comments]').attr('checked') == 'checked',
		format: $('select[name=format] option:selected').val()
	}
	
	$.post('compile.php?' + $.param(options), code, function(json) {
		editors['assembler'].setValue(json.code.assembler);
		editors['byte'].setValue(json.code.byte);

		if (json.messages.length > 0) {
			$('#messages pre').text(json.messages);
			$('#messages').show('slow');
		}
		else {
			$('#messages').hide('slow');
		}
		
		mapping = json.mapping;
	}, 'json');
}

function range(start, end) {
	var arr = new Array;
	for (var i = start; i <= end; i++) {
		arr.push(i);
	}
	return arr;
}
