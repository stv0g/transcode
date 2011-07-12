<?php

header('Content-type: application/json');

/* Configuration */
$maxLength = 2048;
$allowedMmcus = array('attiny15', 'attiny45', 'atmega8u2', 'atmega8', 'atmega328p', 'atmega644p', 'atxmega128a1', 'attiny28', 'attiny48', 'atmega603', 'atmega103', 'attiny167', 'atmega48', 'atmega16', 'atmega1284p', 'atmega2560');

$oLevel = (isset($_GET['olevel'])) ? (int) $_GET['olevel'] : 0;
$mmcu = (isset($_GET['mmcu'])) ? $_GET['mmcu'] : 'atmega8';
$format = (isset($_GET['format'])) ? $_GET['format'] : 'bin';
$comments = isset($_GET['comments']) && $_GET['comments'] == '1';

$codeFile = tempnam('/tmp', 'tc_in_') . '.c';
$code = file_get_contents('php://input');
file_put_contents($codeFile, $code);

if (!in_array($mmcu, $allowedMmcus)) {
	$messages = array('Are you kidding me?!');
}
elseif (strlen($code) > $maxLength) {
	$messages = array('Die Maximale Codelänge wurde überschritten (' . $maxLength . ')');
}
else {
	// compile
	$outFile = tempnam('/tmp', 'tc_out_');
	$disableOptimize = ' -O0 -fno-align-loops -fno-argument-alias' .
		' -fno-auto-inc-dec -fno-branch-count-reg -fno-common' .
		' -fno-early-inlining -fno-eliminate-unused-debug-types' .
		' -fno-function-cse -fno-gcse-lm -fno-ident -fno-ivopts' .
		' -fno-keep-static-consts -fno-leading-underscore' .
		' -fmath-errno -fno-merge-debug-strings' .
		' -fno-move-loop-invariants -fpeephole -fno-reg-struct-return' .
		' -fno-sched-interblock -fno-sched-spec -fno-sched-stalled-insns-dep' .
		' -fno-signed-zeros -fno-split-ivs-in-unroller' .
		' -fno-toplevel-reorder -fno-trapping-math -fno-tree-cselim' .
		' -fno-tree-loop-im -fno-tree-loop-ivcanon -fno-tree-loop-optimize' .
		' -fno-tree-reassoc -fno-tree-scev-cprop -fno-tree-vect-loop-version' .
		' -fno-var-tracking -fno-verbose-asm -fno-zero-initialized-in-bss' .
		' -fno-argument-noalias -fno-math-errno' .
		' -fno-pcc-struct-return -fno-peephole';
		
	$cmd = 'avr-gcc -mmcu=' . $mmcu . ' -g3 -o ' . $outFile . ' ' . $codeFile;
	
	if ($oLevel < 0) {
		$cmd .=  $disableOptimize;
	}
	else if ($oLevel >= 0) {
		$cmd .= ' -O' . $oLevel;
	}
	
	exec($cmd . ' 2>&1', $messages, $result);
	
	// objdump
	$cmd = 'avr-objdump -w -d -l -z ' . $outFile . ' 2>&1';
	$dump = shell_exec($cmd);

	// refactor
	$dumpLines = explode("\n", $dump);
	$lastMapping = null;
	$lastLine = null;
	$assembler = array();
	$byte = array();
	$mnemonics = array();
	$mapping = array(
		'ansic' => array(),	// ansic => assembler
		'assembler' => array(),	// assembler => bytecode (1:1)
		'byte' => array()	// bytecode => assembler (1:1)
	);

	foreach ($dumpLines as $line) { // parsing objdump
		if (preg_match( // mnemonic
			'/^\s{2}([0-9a-f]{2}):\t' . // address	\s{2}9a:\ŧ
			'((?:[0-9a-f]{2}\s)+)\s+' . // byte	ec e5\s+\t
			'([a-z]{2,6})\t' . // mnemonic		ldi\t
			'([^;\t]+)' . // operands		r30, 0x5C\t\s;
			'(?:\t;\s(.*))?/', // comment		\s92
		$line, $matches)) {
			$as = $matches[3] . "\t" . $matches[4];
			if ($comments && isset($matches[5])) {
				$as .= "\t; " . $matches[5];
			}
			
			// reorder bytes
			$bytes = array_map('hexdec', explode(' ', trim($matches[2])));
			if (count($bytes) == 4) { // double word instruction
				$bytes = array($bytes[1], $bytes[0], $bytes[3], $bytes[2]);
			}
			else { // single word instruction
				$bytes = array($bytes[1], $bytes[0]);
			}
			
			$assembler[] = $as;
			$byte[] = format($bytes, $format);
			$mnemonics[$matches[3]] = (isset($mnemonics[$matches[3]])) ? $mnemonics[$matches[3]] + 1 : 1;
			
			$mapping['assembler'][count($assembler)] = count($byte);
			$mapping['byte'][count($byte)] = count($assembler);
		}
		elseif (preg_match('/^([0-9a-f]{8}) <(.*)>:/', $line, $matches)) { // label
			$assembler[] = $matches[2] . ':';
		}
		elseif (preg_match('~^' . $codeFile . ':([0-9]+)~', $line, $matches)) { // mapping
			$currentMapping = count($assembler);
			$currentLine = $matches[1];
			
			if ($lastMapping && $lastLine) {
				$mapping['ansic'][$lastLine] = array($lastMapping, $currentMapping);
			}
			
			$lastLine = $currentLine;
			$lastMapping = $currentMapping+1;
		}
	}
	
	// Rest
	$mapping['ansic'][$lastLine] = array($lastMapping, count($assembler));
}

arsort($mnemonics);

$json = array(
	'result' => $result,
	'messages' => implode("\n", $messages),
	'code' => array(
		'assembler' => implode("\n", $assembler),
		'byte' => implode("\n", $byte)
	),
	'mapping' => $mapping,
	'stats' => $mnemonics
);

echo json_encode($json);

unlink($codeFile);
unlink($outFile);

function format($data, $format) {
	if ($format == 'hex') {
		return implode(' ', array_map(function($value) {
			return str_pad(dechex($value), 2, '0', STR_PAD_LEFT);
		}, $data));
	}
	else if ($format == 'dec') {
		return implode(' ', array_map(function($value) {
			return str_pad($value, 3, ' ', STR_PAD_LEFT);
		}, $data));
	}
	else { // if ($format == 'bin') { default
		$bin = array();
		foreach ($data as $byte) {
			$bin[] = str_pad(decbin($byte >> 4), 4, '0', STR_PAD_LEFT); // high nipple
			$bin[] = str_pad(decbin($byte & 0x0f), 4, '0', STR_PAD_LEFT); // low nipple
		}
		return implode(' ', $bin);
	}
}

?>
