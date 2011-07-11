#include <avr/io.h>
#include <stdint.h>

uint16_t fib(uint16_t n) {
	return (n < 2) ? n : fib(n-1) + fib(n-2);
}

int main ( void ) {
	uint16_t result;

	result = fib(8);

	PORTB = (uint8_t) result;
	PORTC = (uint8_t) result >> 8;

	while (1) { /* tue nichts */ }
}
