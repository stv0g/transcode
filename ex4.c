#include <avr/io.h>
#include <avr/interrupt.h>

uint8_t state = 0;

int main ( void ) {
	/* initialize timer */
	TCCR0 |= (1 << CS01) | (1 << CS00) | (1 << WGM01);
	OCR0 = 123;
	TIMSK |= (1 << OCIE0);
	TIFR |= (1 << OCF0);
	 
	sei();
}

ISR(TIMER0_COMP_vect) {
	state ^= 0xff;
}
