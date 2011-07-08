#include <avr/io.h>
#include <stdint.h>

int main ( void ) {
	uint8_t foo = 5;

	/* initialisiere PORTD */
	DDRD = 0xff;
	PORTD = 0x00;

	while (foo) {
		PORTD = foo;
		foo--;
	}

	while (1) {
		/* tue nichts */
	}
}
