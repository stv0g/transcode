<?php

header('Content-type: application/json');

/* Configuration */
$maxLength = 2048;
$allowedMmcus = array('attiny15', 'attiny45', 'atmega8u2', 'atmega8', 'atmega328p', 'atmega644p', 'atxmega128a1', 'avr1', 'avr2', 'avr25', 'avr3', 'avr31', 'avr35', 'avr4', 'avr5', 'avr51', 'avr6');

$oLevel = (isset($_GET['olevel'])) ? (int) $_GET['olevel'] : 0;
$mmcu = (isset($_GET['mmcu'])) ? $_GET['mmcu'] : 'atmega8';
$format = (isset($_GET['format'])) ? $_GET['format'] : 'bin';
$comments = (isset($_GET['comments']) && $_GET['comments'] == 'true');

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
	$cmd = 'avr-gcc -mmcu=' . $mmcu . ' -g -O' . $oLevel . ' -o ' . $outFile . ' ' . $codeFile . ' 2>&1';
	exec($cmd, $messages, $result);
	
	// objdump
	$cmd = 'avr-objdump -w -d -l ' . $outFile . ' 2>&1';
	$dump = shell_exec($cmd);

	// refactor
	$dumpLines = explode("\n", $dump);
	$assembler = array();
	$byte = array();
	$mapping = array();

	foreach ($dumpLines as $line) { // parsing objdump
		if (preg_match('/^\s+([0-9a-f]+):\t+([0-9a-f ]{5})\s+(.*)\t; (.*)/', $line, $matches)) { // mnemonic
			$mnemonic = ($comments) ? $matches[3] . "\t;" . $matches[4] : $matches[3];
			$assembler[] = $mnemonic;
			$byte[] = format($matches[2], $format);
		}
		elseif (preg_match('/^([0-9a-f]{8}) <(.*)>:/', $line, $matches)) { // assembler label
			$assembler[] = $matches[2] . ':';
		}
		elseif (preg_match('~^' . $codeFile . ':([0-9]+)~', $line, $matches)) {
			$mapping[$matches[1]] = count($assembler)+1;
		}
	}
}

$json = array(
	'result' => $result,
	'messages' => implode("\n", $messages),
	'code' => array(
		'assembler' => implode("\n", $assembler),
		'byte' => implode("\n", $byte)
	),
	'mapping' => $mapping
);

echo json_encode($json);

unlink($codeFile);
unlink($outFile);

function format($data, $format) {
	$hex = strtr($data, ' ', '');
	$dec = hexdec($hex);

	if ($format == 'hex') {
			return $hex;
	}
	else if ($format == 'dec') {
		return $dec;
	}
	else { // if ($format == 'bin') { default
		$bin = array();
		foreach (str_split($hex) as $char) {
			$bin[] = str_pad(decbin(hexdec($char)), 4, '0', STR_PAD_LEFT);
		}
		return implode(' ', $bin);
	}
}

?>
