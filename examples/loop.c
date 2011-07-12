#include <avr/io.h>
#include <stdint.h>

int main ( void ) {
	uint8_t foo = 33;

	while (foo) {
		PORTD ^= foo;
		foo--;
	}

	return 0;
}
