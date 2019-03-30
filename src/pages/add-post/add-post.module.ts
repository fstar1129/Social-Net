import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddPostPage } from './add-post';

@NgModule({
  declarations: [
    AddPostPage,
  ],
  imports: [
    IonicPageModule.forChild(AddPostPage),
  ],
  exports: [
    AddPostPage
  ]
})
export class AddPostPageModule {}
