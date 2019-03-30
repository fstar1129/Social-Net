import { Injectable, Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'DateFormat'
})
@Injectable()
export class DateFormatPipe implements PipeTransform {
  // DateFormatPipe
  // Show moment.js dateFormat for time elapsed.
  transform(date: any, args?: any): any {
    return moment(new Date(date)).fromNow();
  }
}
