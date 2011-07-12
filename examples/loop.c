#include <avr/io.h>
#include <stdint.h>

int main ( void ) {
	uint8_t foo = 33;

	while (foo) {
		PORTD ^= foo;
		foo--;
	}

	while (1) { /* tue nichts */ }
}
