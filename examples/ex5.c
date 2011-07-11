#include <util/delay.h>
#include <avr/io.h>
/* ADC initialisieren */
void adc_init(void) {
	uint16_t result;
 
	ADMUX = (0<<REFS1) | (1<<REFS0);      // AVcc als Referenz benutzen
//	ADMUX = (1<<REFS1) | (1<<REFS0);      // interne Referenzspannung nutzen
	ADCSRA = (1<<ADPS1) | (1<<ADPS0);     // Frequenzvorteiler
	ADCSRA |= (1<<ADEN);                  // ADC aktivieren
 
	/* nach Aktivieren des ADC wird ein "Dummy-Readout" empfohlen, man liest
	  also einen Wert und verwirft diesen, um den ADC "warmlaufen zu lassen" */ 
	ADCSRA |= (1<<ADSC);                  // eine ADC-Wandlung 
	while (ADCSRA & (1<<ADSC) ) {}        // auf Abschluss der Konvertierung warten

	/* ADCW muss einmal gelesen werden, sonst wird Ergebnis der nächsten
	Wandlung nicht übernommen. */
	result = ADCW;
}
 
/* ADC Einzelmessung */
uint16_t adc_read(uint8_t channel) {
	// Kanal waehlen, ohne andere Bits zu beeinflußen
	ADMUX = (ADMUX & ~(0x1F)) | (channel & 0x1F);
	ADCSRA |= (1<<ADSC);            // eine Wandlung "single conversion"
	while (ADCSRA & (1<<ADSC) ) {}  // auf Abschluss der Konvertierung warten
	return ADCW;                    // ADC auslesen und zurückgeben
}
 
/* ADC Mehrfachmessung mit Mittelwertbbildung */
uint16_t adc_read_avg(uint8_t channel, uint8_t average) {
	uint32_t result = 0;
 
	for (uint8_t i = 0; i < average; ++i ) {
		result += adc_read( channel );
	}
 
	return (uint16_t) (result / average);
}

struct state_t {
	int direction:1;
	int running:1;
};

int main(void) {
	uint16_t adcval = 0;
	uint16_t counter = 0;
	struct state_t state = {0, 1};
	
	adc_init();

	/* setup ports */
	DDRC = 0xff; /* set port A as output */
	PORTC = 0xff; /* disable output */
	DDRA = 0x00; /* set port C as input */
	PORTA = 0xff; /* enable pullups */
	
	while (1) {
		adcval = adc_read(7); // 10bit => < 1024
		_delay_ms(adcval/2); // < 5secs
		
		if (PINA & (1 << 0)) { /* start/pause */
			state.running ^= 0xff;
		}
		
		if (!(PINA & (1 << 1))) { /* change direction */
			PORTC = 0xff;
			counter = 0;
			state.direction ^= 0xff;
		}

		if (state.running) {
			counter += (state.direction) ? 1 : -1;
			counter %= 8;
			PORTC ^= (1 << counter);
		}
	}
}
